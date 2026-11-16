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

        return "Bạn là Trợ lý AI tư vấn thời trang của cửa hàng FunnyShop (thương hiệu thời trang nam, nữ và unisex phong cách trẻ trung, hiện đại).\n" +
                "\n" +
                "Danh sách sản phẩm THỜI TRANG thực tế của FunnyShop:\n" +
                catalog +
                "\n" +
                "QUY TẮC BẮT BUỘC:\n" +
                "1. ĐÚNG DỰ ÁN: Cửa hàng CHỈ bán quần áo thời trang (áo polo, sơ mi, quần jeans, đầm midi, áo blazer, áo hoodie...). TUYỆT ĐỐI KHÔNG tư vấn hoặc nhắc tới đồ chơi, gấu bông, quà lưu niệm hay đồ gia dụng.\n" +
                "2. KHÔNG GỢI Ý LUNG TUNG:\n" +
                "   - Nếu khách chỉ chào hỏi xã giao (như \"alo\", \"chào\", \"hi\", \"hello\"), hãy chào lại lịch sự, thân thiện và hỏi nhu cầu cần tìm đồ nam hay nữ. KHÔNG đính kèm sản phẩm nào.\n" +
                "   - Chỉ khi khách hỏi tìm đồ, hỏi giá, phối đồ hoặc nhờ gợi ý, bạn mới gợi ý 1 đến 3 sản phẩm phù hợp nhất từ danh sách trên.\n" +
                "3. KHI CÓ GỢI Ý SẢN PHẨM: Đặt dòng này ở cuối cùng của câu trả lời: RECOMMENDED_PRODUCT_IDS: [id1, id2]. Nếu không có gợi ý cụ thể hoặc khách chỉ chào hỏi, KHÔNG ghi dòng này.\n" +
                "4. CHÍNH SÁCH: Giao hàng toàn quốc 2-4 ngày, kiểm tra trước khi nhận (COD) hoặc quét VietQR PayOS, đổi size trong 7 ngày.\n" +
                "\n" +
                "Khách hàng hỏi: " + userMsg;
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

    private ChatResponse buildFallbackResponse(String userMsg, List<Product> products) {
        String lower = userMsg.toLowerCase().trim();
        List<ProductSummaryResponse> recommended = new ArrayList<>();

        String reply;
        if (lower.equals("alo") || lower.equals("alô") || lower.contains("chào") || lower.contains("hi") || lower.contains("hello") || lower.contains("bạn ơi") || lower.contains("shop ơi")) {
            reply = "Dạ FunnyShop xin chào bạn! Mình là Trợ lý AI tư vấn thời trang của FunnyShop. Bạn đang quan tâm đến trang phục thời trang nam, thời trang nữ hay áo hoodie/phụ kiện hôm nay ạ? 👔👗";
            // Lời chào không đính kèm sản phẩm lung tung
        } else if (lower.equals("tôi muốn đặt hàng") || lower.equals("mình muốn đặt hàng") || lower.equals("đặt hàng") || lower.equals("mua hàng") || lower.equals("tôi muốn mua") || lower.equals("mình muốn mua") || lower.equals("mua đồ") || lower.equals("đặt đồ")) {
            reply = "Dạ bạn muốn đặt sản phẩm nào của FunnyShop ạ? Bạn có thể cho mình biết tên sản phẩm hoặc loại trang phục bạn đang tìm (ví dụ: áo polo, sơ mi, quần jeans, đầm midi hay áo blazer) để mình mở đơn và hỗ trợ đặt ngay cho bạn nhé! 🛍️";
            int limit = Math.min(3, products.size());
            for (int i = 0; i < limit; i++) {
                recommended.add(toSummary(products.get(i)));
            }
        } else if (lower.contains("giao hàng") || lower.contains("ship") || lower.contains("vận chuyển")) {
            reply = "FunnyShop hỗ trợ giao hàng toàn quốc từ 2 - 4 ngày làm việc. Bạn được kiểm tra hàng trước khi thanh toán (COD) hoặc thanh toán online qua VietQR PayOS thuận tiện nhé!";
        } else if (lower.contains("thanh toán") || lower.contains("payos") || lower.contains("qr") || lower.contains("chuyển khoản")) {
            reply = "Shop hỗ trợ 2 hình thức thanh toán an toàn: Thanh toán khi nhận hàng (COD) và Quét mã VietQR 24/7 qua cổng PayOS.";
        } else if (lower.contains("đổi trả") || lower.contains("size")) {
            reply = "FunnyShop hỗ trợ đổi size hoặc đổi mẫu trong vòng 7 ngày nếu không vừa hoặc có lỗi từ nhà sản xuất. Bạn yên tâm mua sắm nhé!";
        } else {
            reply = "Dạ, dưới đây là những mẫu trang phục thời trang nổi bật tại FunnyShop dành cho bạn:";
            int limit = Math.min(3, products.size());
            for (int i = 0; i < limit; i++) {
                recommended.add(toSummary(products.get(i)));
            }
        }

        return ChatResponse.builder()
                .reply(reply)
                .products(recommended)
                .build();
    }
}

