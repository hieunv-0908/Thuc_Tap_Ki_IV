package com.funnyshop.service.impl;

import com.funnyshop.config.GeminiProperties;
import com.funnyshop.dto.response.ChatResponse;
import com.funnyshop.dto.response.ProductSummaryResponse;
import com.funnyshop.entity.Product;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.AiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final Pattern PRODUCT_IDS_PATTERN = Pattern.compile("(?i)RECOMMENDED_PRODUCT_IDS:\\s*\\[(.*?)\\]");

    private static final List<ProductSummaryResponse> DEFAULT_FALLBACK_PRODUCTS = List.of(
            ProductSummaryResponse.builder()
                    .id(1L)
                    .name("Áo Polo Nam Classic Cotton Cool")
                    .price(BigDecimal.valueOf(299000))
                    .imageUrl("https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop")
                    .categoryName("Thời trang Nam")
                    .build(),
            ProductSummaryResponse.builder()
                    .id(10L)
                    .name("Áo Sơ Mi Nam Công Sở")
                    .price(BigDecimal.valueOf(299000))
                    .imageUrl("https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8iO_byH5gLlB8U9H4k7vILDQloQgy8zDmSNzLA0Mb186sLQ4nc4haLPVqasnCPrJh8LKgYuWPsJAVyOHCAbr7yRxnDhxNBgh22yl7N8kKIbLMVOYrH8-wfg&usqp=CAc")
                    .categoryName("Thời trang Nam")
                    .build(),
            ProductSummaryResponse.builder()
                    .id(2L)
                    .name("Quần Jeans Nam Slim Fit Denim")
                    .price(BigDecimal.valueOf(499000))
                    .imageUrl("https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop")
                    .categoryName("Thời trang Nam")
                    .build(),
            ProductSummaryResponse.builder()
                    .id(3L)
                    .name("Đầm Midi Nữ Thiết Kế Cổ V")
                    .price(BigDecimal.valueOf(550000))
                    .imageUrl("https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop")
                    .categoryName("Thời trang Nữ")
                    .build(),
            ProductSummaryResponse.builder()
                    .id(4L)
                    .name("Áo Blazer Nữ Công Sở Hàn Quốc")
                    .price(BigDecimal.valueOf(680000))
                    .imageUrl("https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop")
                    .categoryName("Thời trang Nữ")
                    .build(),
            ProductSummaryResponse.builder()
                    .id(5L)
                    .name("Áo Hoodie Unisex Oversize Form Rộng")
                    .price(BigDecimal.valueOf(380000))
                    .imageUrl("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop")
                    .categoryName("Unisex & Phụ kiện")
                    .build()
    );

    private final GeminiProperties geminiProperties;
    private final ProductRepository productRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional(readOnly = true)
    public ChatResponse chat(String message) {
        if (message == null || message.trim().isEmpty()) {
            return ChatResponse.builder()
                    .reply("Xin chào! Mình là Trợ lý AI FunnyShop. Bạn cần mình tư vấn quà tặng hay tìm sản phẩm nào hôm nay? 🎁")
                    .products(Collections.emptyList())
                    .build();
        }

        String userMsg = message.trim();
        List<Product> availableProducts = loadAvailableProducts();

        String apiKey = geminiProperties != null ? geminiProperties.getApiKey() : null;
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("test-api-key")) {
            log.warn("[Gemini AI] Chưa cấu hình API Key. Kích hoạt fallback gợi ý sản phẩm.");
            return buildFallbackResponse(userMsg, availableProducts);
        }

        try {
            String model = (geminiProperties.getModel() != null && !geminiProperties.getModel().isBlank())
                    ? geminiProperties.getModel()
                    : "gemini-3.5-flash";

            String prompt = buildPrompt(userMsg, availableProducts);
            String url = GEMINI_API_BASE_URL + model + ":generateContent?key=" + apiKey;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", Collections.singletonList(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentMap));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String rawText = extractTextFromGeminiResponse(response.getBody());
                if (rawText != null && !rawText.isBlank()) {
                    return parseGeminiResponse(rawText, availableProducts);
                }
            }

            log.warn("[Gemini AI] Phản hồi rỗng từ Gemini API. Chuyển sang fallback.");
            return buildFallbackResponse(userMsg, availableProducts);

        } catch (Exception e) {
            log.error("[Gemini AI] Lỗi khi gọi Gemini API: {}", e.getMessage(), e);
            return buildFallbackResponse(userMsg, availableProducts);
        }
    }

    @Override
    public String generateProductDescription(String productName) {
        String apiKey = geminiProperties != null ? geminiProperties.getApiKey() : null;
        if (apiKey == null || apiKey.isBlank()) {
            return "Sản phẩm " + productName + " độc đáo, chất lượng cao tại FunnyShop. Thiết kế hiện đại, tiện ích và phù hợp làm quà tặng ý nghĩa.";
        }

        try {
            String model = (geminiProperties.getModel() != null && !geminiProperties.getModel().isBlank())
                    ? geminiProperties.getModel()
                    : "gemini-3.5-flash";

            String url = GEMINI_API_BASE_URL + model + ":generateContent?key=" + apiKey;
            String prompt = "Hãy viết một đoạn mô tả sản phẩm hấp dẫn, dí dỏm, chuẩn SEO (khoảng 3-4 câu) cho sản phẩm thương mại điện tử: " + productName + " của cửa hàng quà tặng FunnyShop.";

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", Collections.singletonList(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentMap));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String text = extractTextFromGeminiResponse(response.getBody());
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            }
        } catch (Exception e) {
            log.warn("[Gemini AI] Lỗi tạo mô tả sản phẩm: {}", e.getMessage());
        }

        return "Sản phẩm " + productName + " độc đáo, chất lượng cao tại FunnyShop. Thiết kế hiện đại, tiện ích và phù hợp làm quà tặng ý nghĩa.";
    }

    private List<Product> loadAvailableProducts() {
        try {
            return productRepository.findAll(PageRequest.of(0, 20))
                    .getContent()
                    .stream()
                    .filter(p -> p != null && !Boolean.TRUE.equals(p.getIsDeleted()))
                    .toList();
        } catch (Exception e) {
            log.warn("[Gemini AI] Không thể tải danh sách sản phẩm: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String buildPrompt(String userMsg, List<Product> products) {
        StringBuilder catalog = new StringBuilder();
        if (products != null && !products.isEmpty()) {
            for (Product p : products) {
                String catName = (p.getCategory() != null && p.getCategory().getName() != null)
                        ? p.getCategory().getName()
                        : "Thời trang";
                BigDecimal price = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
                catalog.append(String.format("- ID: %d | Tên: %s | Giá: %s VNĐ | Danh mục: %s\n",
                        p.getId(), p.getName(), price.toPlainString(), catName));
            }
        }

        return "BẠN LÀ MỘT STYLIST KIÊM CHUYÊN VIÊN TƯ VẤN BÁN HÀNG THỜI TRANG BẰNG XƯƠNG BẰNG THỊT CỦA FUNNYSHOP.\n" +
                "Bạn đang trò chuyện trực tiếp với khách hàng trên khung chat (như nhắn tin qua Zalo, Messenger hoặc Instagram của shop thời trang).\n" +
                "\n" +
                "PHONG CÁCH GIAO TIẾP (BẮT BUỘC GIỐNG NGƯỜI THẬT 100%):\n" +
                "- Xưng hô: Tự nhiên, ấm áp, lễ phép và thân thiện (Dạ em chào anh/chị/bạn, em tư vấn cho mình nhé, bên em đang có mẫu này xinh lắm ạ...). TUYỆT ĐỐI KHÔNG nói giọng robot, máy móc hay khuôn sáo.\n" +
                "- Đồng cảm & Nắm bắt nhu cầu: Khi khách nói các câu tự nhiên như \"tôi muốn...\", \"tôi đang cần...\", \"mình đang cần...\", \"đang cần...\", hãy hưởng ứng ngay nhu cầu của khách (ví dụ: 'Dạ em hiểu rồi ạ! Nếu mình đang cần mẫu để đi làm thì...', 'Dạ bên em có mấy mẫu này mặc lên tôn dáng lắm nè bạn!').\n" +
                "- Tư vấn có gu: Nêu ngắn gọn lý do vì sao mẫu đó hợp (chất liệu mát, phom tôn dáng, dễ phối đồ, lịch sự khi đi làm hoặc trẻ trung khi đi chơi).\n" +
                "- Độ dài: Ngắn gọn, súc tích (khoảng 2 - 4 câu tự nhiên như một tin nhắn chat thật), sau đó gợi ý sản phẩm.\n" +
                "\n" +
                "DANH SÁCH SẢN PHẨM THỜI TRANG HIỆN CÓ CỦA SHOP:\n" +
                catalog +
                "\n" +
                "QUY TẮC BẮT BUỘC:\n" +
                "1. ĐÚNG DANH MỤC & ĐỐI TƯỢNG:\n" +
                "   - Khi khách tìm/cần đồ nam ('thời trang nam', 'đồ nam', 'áo nam', 'quần nam', 'đang cần đồ nam'): CHỈ tư vấn và gợi ý các sản phẩm thời trang Nam. Tuyệt đối không đưa váy đầm nữ.\n" +
                "   - Khi khách tìm/cần đồ nữ ('thời trang nữ', 'đồ nữ', 'váy', 'đầm', 'đang cần đồ nữ'): CHỈ tư vấn sản phẩm thời trang Nữ.\n" +
                "   - Khi khách hỏi phối đồ, công sở, dạo phố: Tư vấn kết hợp trang phục hợp lý.\n" +
                "   - Khi khách cần đồ rẻ/tiết kiệm: Tư vấn các mẫu giá thấp nhất.\n" +
                "   - TUYỆT ĐỐI KHÔNG bịa ra sản phẩm không có trong danh sách trên.\n" +
                "2. HỖ TRỢ ĐẶT HÀNG:\n" +
                "   - Khi khách nói chung chung ('muốn đặt hàng', 'đặt cho mình'): Hỏi khách muốn chốt mẫu cụ thể nào để em lên đơn.\n" +
                "   - Khi khách nói rõ sản phẩm muốn mua: Báo giá, xác nhận và ghi kèm: ORDER_TARGET_ID: [id].\n" +
                "3. KHI CÓ GỢI Ý SẢN PHẨM: Đặt dòng này ở cuối cùng: RECOMMENDED_PRODUCT_IDS: [id1, id2] (tối đa 2-3 sản phẩm). Nếu khách chỉ chào hỏi bình thường thì không ghi dòng này.\n" +
                "4. CHÍNH SÁCH: Giao hàng toàn quốc 2-4 ngày, đồng kiểm khi nhận (COD) hoặc VietQR PayOS, đổi size/đổi mẫu trong 7 ngày.\n" +
                "\n" +
                "Khách hàng nhắn: " + userMsg;
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromGeminiResponse(Map<?, ?> body) {
        try {
            List<?> candidates = (List<?>) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> candidate = (Map<String, Object>) candidates.get(0);
                Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                if (content != null) {
                    List<?> parts = (List<?>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map<String, Object> part = (Map<String, Object>) parts.get(0);
                        return String.valueOf(part.getOrDefault("text", ""));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[Gemini AI] Lỗi bóc tách nội dung phản hồi: {}", e.getMessage());
        }
        return null;
    }

    private ChatResponse parseGeminiResponse(String rawText, List<Product> availableProducts) {
        String cleanReply = rawText;
        List<Long> productIds = new ArrayList<>();

        Matcher matcher = PRODUCT_IDS_PATTERN.matcher(rawText);
        if (matcher.find()) {
            String idsGroup = matcher.group(1);
            cleanReply = matcher.replaceFirst("").trim();
            if (idsGroup != null && !idsGroup.isBlank()) {
                String[] parts = idsGroup.split("[,;\\s]+");
                for (String p : parts) {
                    try {
                        String clean = p.replaceAll("[^0-9]", "");
                        if (!clean.isEmpty()) {
                            productIds.add(Long.valueOf(clean));
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }

        List<ProductSummaryResponse> recommended = new ArrayList<>();
        Map<Long, Product> productMap = new HashMap<>();
        for (Product p : availableProducts) {
            if (p.getId() != null) {
                productMap.put(p.getId(), p);
            }
        }

        for (Long id : productIds) {
            Product p = productMap.get(id);
            if (p != null) {
                recommended.add(toSummary(p));
            } else {
                try {
                    productRepository.findByIdAndIsDeletedFalse(id)
                            .ifPresent(found -> recommended.add(toSummary(found)));
                } catch (Exception ignored) {
                }
            }
        }

        return ChatResponse.builder()
                .reply(cleanReply)
                .products(recommended)
                .build();
    }

    private ProductSummaryResponse toSummary(Product p) {
        String catName = (p.getCategory() != null && p.getCategory().getName() != null)
                ? p.getCategory().getName()
                : "FunnyShop";

        return ProductSummaryResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .price(p.getPrice())
                .imageUrl(p.getImageUrl())
                .categoryName(catName)
                .build();
    }

    private boolean isSimpleGreeting(String lower) {
        if (lower == null || lower.isBlank()) return false;
        // Nếu có các từ khóa thời trang hoặc tìm kiếm -> Không được xem là lời chào đơn thuần
        if (lower.contains("nam") || lower.contains("nữ") || lower.contains("áo") || lower.contains("quần")
                || lower.contains("thời trang") || lower.contains("tìm hiểu") || lower.contains("gợi ý")
                || lower.contains("polo") || lower.contains("sơ mi") || lower.contains("jean")
                || lower.contains("đầm") || lower.contains("váy") || lower.contains("blazer")
                || lower.contains("hoodie") || lower.contains("giá") || lower.contains("size")) {
            return false;
        }

        return lower.equals("hi") || lower.equals("hello") || lower.equals("alo") || lower.equals("alô")
                || lower.equals("chào") || lower.equals("chào shop") || lower.equals("chào bạn")
                || lower.equals("bạn ơi") || lower.equals("shop ơi") || lower.equals("ad ơi")
                || lower.equals("hey") || lower.equals("ê") || lower.equals("có ai không")
                || lower.startsWith("chào shop") || lower.startsWith("chào bạn");
    }

    private ChatResponse buildFallbackResponse(String userMsg, List<Product> products) {
        String lower = userMsg.toLowerCase().trim();
        List<ProductSummaryResponse> recommended = new ArrayList<>();

        // Danh sách sản phẩm khả dụng: nếu database trống thì dùng catalog dự phòng chuẩn
        List<ProductSummaryResponse> pool = new ArrayList<>();
        if (products != null && !products.isEmpty()) {
            products.forEach(p -> pool.add(toSummary(p)));
        } else {
            pool.addAll(DEFAULT_FALLBACK_PRODUCTS);
        }

        String reply;
        if (isSimpleGreeting(lower)) {
            reply = "Dạ em chào bạn nha! Em là Stylist tư vấn của FunnyShop đây ạ 👋\nMình đang cần tìm trang phục đi làm, đi chơi hay chuẩn bị đi tiệc thế ạ? Cứ nhắn cho em để em tư vấn set đồ ưng ý nhất cho mình nhé! 👔👗";
        } else if (lower.equals("tôi muốn đặt hàng") || lower.equals("mình muốn đặt hàng") || lower.equals("đặt hàng") || lower.equals("mua hàng") || lower.equals("tôi muốn mua") || lower.equals("mình muốn mua") || lower.equals("mua đồ") || lower.equals("đặt đồ") || lower.contains("chốt đơn")) {
            reply = "Dạ em hỗ trợ lên đơn cho mình ngay đây ạ! Bạn đang muốn chốt mẫu nào của shop thế ạ (ví dụ: áo polo, sơ mi, quần jeans hay đầm midi)? Bạn nhắn em tên sản phẩm để em giữ hàng và tạo đơn ngay cho mình nha! 🛍️";
            pool.stream().limit(3).forEach(recommended::add);
        } else if (lower.contains("giao hàng") || lower.contains("ship") || lower.contains("vận chuyển")) {
            reply = "Dạ bên em ship hàng toàn quốc chỉ từ 2 - 4 ngày thôi ạ! Khi nhận hàng mình được đồng kiểm, mở ra xem ưng ý rồi mới thanh toán (COD), hoặc quét mã VietQR PayOS siêu tiện lợi luôn nha bạn! 🚚";
        } else if (lower.contains("thanh toán") || lower.contains("payos") || lower.contains("qr") || lower.contains("chuyển khoản") || lower.contains("cod")) {
            reply = "Dạ bên em có 2 hình thức thanh toán cực kỳ an toàn: Bạn có thể nhận hàng kiểm tra rồi mới gửi tiền mặt (COD), hoặc quét mã VietQR tự động qua PayOS 24/7 đều được nha! 💳";
        } else if (lower.contains("đổi trả") || lower.contains("size") || lower.contains("bảng size") || lower.contains("đổi hàng") || lower.contains("chiều cao") || lower.contains("cân nặng") || lower.contains("nặng") || lower.contains("cao")) {
            reply = "Dạ bạn cứ nhắn cho em chiều cao và cân nặng (ví dụ: cao 1m70 nặng 65kg) là em bắt size chuẩn chỉnh cho mình luôn nha! Nếu lỡ mặc chưa vừa thì bên em hỗ trợ đổi size tận nơi trong 7 ngày hoàn toàn yên tâm ạ ❤️";
        } else if (lower.contains("nam") || lower.contains("đồ nam") || lower.contains("áo nam") || lower.contains("quần nam")) {
            reply = "Dạ em hiểu nhu cầu của mình rồi nè! Đồ nam bên em thiết kế phom dáng trẻ trung, vải cotton thoáng mát và cực kỳ tôn dáng. Em gửi bạn xem mấy mẫu polo và sơ mi đang được khách nhà em chuộng nhất nha: ✨";
            List<ProductSummaryResponse> menItems = pool.stream()
                    .filter(p -> {
                        String cat = (p.getCategoryName() != null) ? p.getCategoryName().toLowerCase() : "";
                        String name = (p.getName() != null) ? p.getName().toLowerCase() : "";
                        return cat.contains("nam") || name.contains("nam") || name.contains("polo") || name.contains("sơ mi") || name.contains("jean");
                    })
                    .limit(3)
                    .toList();
            if (menItems.isEmpty()) {
                menItems = pool.stream().limit(3).toList();
            }
            recommended.addAll(menItems);
        } else if (lower.contains("nữ") || lower.contains("đồ nữ") || lower.contains("áo nữ") || lower.contains("váy") || lower.contains("đầm")) {
            reply = "Dạ đây nè bạn ơi! Các mẫu đầm midi và blazer nữ nhà em lên phom nhẹ nhàng, thanh lịch mà tôn dáng lắm luôn. Em gửi bạn xem thử mấy mẫu xinh xắn này nhé: 👗✨";
            List<ProductSummaryResponse> womenItems = pool.stream()
                    .filter(p -> {
                        String cat = (p.getCategoryName() != null) ? p.getCategoryName().toLowerCase() : "";
                        String name = (p.getName() != null) ? p.getName().toLowerCase() : "";
                        return cat.contains("nữ") || name.contains("nữ") || name.contains("đầm") || name.contains("váy") || name.contains("blazer");
                    })
                    .limit(3)
                    .toList();
            if (womenItems.isEmpty()) {
                womenItems = pool.stream().limit(3).toList();
            }
            recommended.addAll(womenItems);
        } else if (lower.contains("công sở") || lower.contains("đi làm") || lower.contains("lịch sự") || lower.contains("formal")) {
            reply = "Dạ đi làm thì ưu tiên hàng đầu là vừa chỉn chu, lịch sự mà mặc cả ngày vẫn phải thoải mái đúng không nè? Em gợi ý cho mình mấy mẫu sơ mi, polo và blazer dễ phối nhất này nha: 💼";
            List<ProductSummaryResponse> officeItems = pool.stream()
                    .filter(p -> {
                        String name = (p.getName() != null) ? p.getName().toLowerCase() : "";
                        return name.contains("sơ mi") || name.contains("blazer") || name.contains("polo") || name.contains("công sở");
                    })
                    .limit(3)
                    .toList();
            if (officeItems.isEmpty()) {
                officeItems = pool.stream().limit(3).toList();
            }
            recommended.addAll(officeItems);
        } else if (lower.contains("phối đồ") || lower.contains("mix") || lower.contains("kết hợp") || lower.contains("mặc với")) {
            reply = "Dạ em mách nhỏ bí quyết phối đồ cực tôn dáng nè: Bạn thử mix áo polo/sơ mi với chiếc quần jeans ống đứng, bên ngoài khoác thêm blazer là có ngay outfit vừa thanh lịch vừa phong cách đi làm hay đi cà phê đều đẹp nha!";
            pool.stream().limit(3).forEach(recommended::add);
        } else if (lower.contains("giá rẻ") || lower.contains("rẻ nhất") || lower.contains("tiết kiệm") || lower.contains("giá tốt") || lower.contains("sale") || lower.contains("khuyến mãi")) {
            reply = "Dạ có ngay ạ! Đây là những mẫu giá cực kỳ yêu thương bên em nhưng chất vải vẫn rất xịn mịn và bền đẹp. Bạn xem thử mấy mẫu giá tốt này nhé:";
            pool.stream()
                    .sorted(Comparator.comparing(p -> (p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO)))
                    .limit(3)
                    .forEach(recommended::add);
        } else if (lower.contains("mới nhất") || lower.contains("xu hướng") || lower.contains("trend") || lower.contains("hot")) {
            reply = "Dạ đây là những mẫu hot hit mới cập bến nhà em được nhiều bạn trẻ săn đón nhất tuần này nè! Em gửi bạn tham khảo nha: 🔥";
            pool.stream()
                    .sorted((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0))
                    .limit(3)
                    .forEach(recommended::add);
        } else if (lower.contains("polo")) {
            reply = "Dạ áo Polo bên em làm từ chất vải Cotton Cool co giãn 4 chiều, thấm hút mồ hôi siêu tốt mặc mùa này mát rượi luôn nè bạn:";
            pool.stream()
                    .filter(p -> p.getName() != null && p.getName().toLowerCase().contains("polo"))
                    .limit(3)
                    .forEach(recommended::add);
            if (recommended.isEmpty()) {
                pool.stream().limit(3).forEach(recommended::add);
            }
        } else if (lower.contains("sơ mi") || lower.contains("so mi")) {
            reply = "Dạ các mẫu Áo Sơ Mi nhà FunnyShop phom dáng may đo chuẩn, cổ áo đứng phom và ít nhăn, mặc đi làm hay đi gặp khách hàng bao sang luôn ạ:";
            pool.stream()
                    .filter(p -> p.getName() != null && (p.getName().toLowerCase().contains("sơ mi") || p.getName().toLowerCase().contains("so mi")))
                    .limit(3)
                    .forEach(recommended::add);
            if (recommended.isEmpty()) {
                pool.stream().limit(3).forEach(recommended::add);
            }
        } else if (lower.contains("jean") || lower.contains("quần")) {
            reply = "Dạ quần jeans bên em chất denim dày dặn vừa phải, co giãn nhẹ và tôn dáng cực kỳ. Em gửi bạn xem thử mẫu bán chạy nhất nha:";
            pool.stream()
                    .filter(p -> p.getName() != null && (p.getName().toLowerCase().contains("jean") || p.getName().toLowerCase().contains("quần")))
                    .limit(3)
                    .forEach(recommended::add);
            if (recommended.isEmpty()) {
                pool.stream().limit(3).forEach(recommended::add);
            }
        } else {
            reply = "Dạ em hiểu nhu cầu của mình rồi nè! Để em gửi bạn tham khảo trước mấy mẫu thời trang đang được yêu thích nhất bên em nha. Bạn thích phong cách nào cứ bảo em nhé: ❤️";
            pool.stream().limit(3).forEach(recommended::add);
        }

        return ChatResponse.builder()
                .reply(reply)
                .products(recommended)
                .build();
    }
}

