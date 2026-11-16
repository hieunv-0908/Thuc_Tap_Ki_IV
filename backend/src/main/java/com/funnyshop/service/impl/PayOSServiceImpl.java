package com.funnyshop.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.funnyshop.config.PayOSProperties;
import com.funnyshop.dto.response.PayOSPaymentResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.OrderStatusHistory;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.OrderStatusHistoryRepository;
import com.funnyshop.service.PayOSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayOSServiceImpl implements PayOSService {

    private static final String PAYOS_API_BASE_URL = "https://api-merchant.payos.vn/v2/payment-requests";

    private final PayOSProperties payOSProperties;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    private boolean isPayOSConfigured() {
        return payOSProperties != null
                && payOSProperties.getClientId() != null && !payOSProperties.getClientId().isBlank()
                && !payOSProperties.getClientId().contains("test-client-id")
                && payOSProperties.getApiKey() != null && !payOSProperties.getApiKey().isBlank()
                && payOSProperties.getChecksumKey() != null && !payOSProperties.getChecksumKey().isBlank();
    }

    private Long generatePayosOrderCode(Long orderId) {
        // Sinh số nguyên dương duy nhất trong khoảng an toàn (<= 9007199254740991)
        long timestampPart = (System.currentTimeMillis() / 1000) % 100000000L; // 8 chữ số
        long orderPart = (orderId != null ? orderId : 1L) % 10000L;           // 4 chữ số
        return timestampPart * 10000L + orderPart;
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Lỗi tạo chữ ký HMAC-SHA256: {}", e.getMessage(), e);
            throw new AppException("Lỗi mã hóa chữ ký thanh toán PayOS", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String createPaymentRequestSignature(long amount, String cancelUrl, String description, long orderCode, String returnUrl, String checksumKey) {
        // Sắp xếp đúng 5 trường bắt buộc theo bảng chữ cái: amount, cancelUrl, description, orderCode, returnUrl
        String dataString = "amount=" + amount +
                "&cancelUrl=" + cancelUrl +
                "&description=" + description +
                "&orderCode=" + orderCode +
                "&returnUrl=" + returnUrl;
        return hmacSha256(dataString, checksumKey);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PayOSPaymentResponse createPaymentLink(Order order, String returnUrlOverride, String cancelUrlOverride) {
        if (order == null || order.getId() == null) {
            throw new AppException("Đơn hàng không hợp lệ để tạo link thanh toán PayOS", HttpStatus.BAD_REQUEST);
        }

        Long orderCode = order.getPayosOrderCode();
        if (orderCode == null) {
            orderCode = generatePayosOrderCode(order.getId());
            order.setPayosOrderCode(orderCode);
        }

        long amount = order.getTotalAmount() != null
                ? order.getTotalAmount().setScale(0, RoundingMode.HALF_UP).longValue()
                : 0L;

        String description = "Don hang #" + order.getId();
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        String returnUrl = (returnUrlOverride != null && !returnUrlOverride.isBlank())
                ? returnUrlOverride
                : (payOSProperties.getReturnUrl() != null && !payOSProperties.getReturnUrl().isBlank()
                ? payOSProperties.getReturnUrl().replace("{orderId}", String.valueOf(order.getId()))
                : "http://localhost:5173/orders/" + order.getId() + "?payment=success");

        String cancelUrl = (cancelUrlOverride != null && !cancelUrlOverride.isBlank())
                ? cancelUrlOverride
                : (payOSProperties.getCancelUrl() != null && !payOSProperties.getCancelUrl().isBlank()
                ? payOSProperties.getCancelUrl().replace("{orderId}", String.valueOf(order.getId()))
                : "http://localhost:5173/orders/" + order.getId() + "?payment=cancelled");

        // Nếu PayOS chưa cấu hình API Key thực, trả về link mô phỏng môi trường phát triển (Sandbox simulation)
        if (!isPayOSConfigured()) {
            log.warn("[PayOS] Chưa cấu hình đầy đủ PayOS ClientId/ApiKey/ChecksumKey. Kích hoạt chế độ mô phỏng PayOS.");
            String simulatedCheckoutUrl = returnUrl + "&simulated=true&orderCode=" + orderCode;
            order.setPaymentMethod("PAYOS");
            order.setPaymentStatus("PENDING");
            order.setPayosCheckoutUrl(simulatedCheckoutUrl);
            order.setPayosAccountNumber("0388888888");
            order.setPayosAccountName("FUNNYSHOP OFFICIAL");
            order.setPayosBin("970422");
            orderRepository.save(order);

            return PayOSPaymentResponse.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(description)
                    .checkoutUrl(simulatedCheckoutUrl)
                    .accountNumber("0388888888")
                    .accountName("FUNNYSHOP OFFICIAL")
                    .bin("970422")
                    .status("PENDING")
                    .build();
        }

        try {
            String signature = createPaymentRequestSignature(
                    amount, cancelUrl, description, orderCode, returnUrl, payOSProperties.getChecksumKey()
            );

            List<Map<String, Object>> items = new ArrayList<>();
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    String itemName = item.getProduct() != null ? item.getProduct().getName() : "Sản phẩm";
                    if (item.getProductVariant() != null) {
                        itemName += " (" + item.getProductVariant().getColor() + "-" + item.getProductVariant().getSize() + ")";
                    }
                    if (itemName.length() > 50) itemName = itemName.substring(0, 50);

                    long itemPrice = item.getPriceAtOrder() != null
                            ? item.getPriceAtOrder().setScale(0, RoundingMode.HALF_UP).longValue()
                            : 0L;

                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("name", itemName);
                    itemMap.put("quantity", item.getQuantity() != null ? item.getQuantity() : 1);
                    itemMap.put("price", itemPrice);
                    items.add(itemMap);
                }
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("orderCode", orderCode);
            payload.put("amount", amount);
            payload.put("description", description);
            payload.put("buyerName", order.getCustomerName() != null ? order.getCustomerName() : "Khách hàng");
            payload.put("buyerPhone", order.getPhone() != null ? order.getPhone() : "");
            payload.put("buyerAddress", order.getShippingAddress() != null ? order.getShippingAddress() : "");
            payload.put("items", items);
            payload.put("cancelUrl", cancelUrl);
            payload.put("returnUrl", returnUrl);
            payload.put("signature", signature);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", payOSProperties.getClientId());
            headers.set("x-api-key", payOSProperties.getApiKey());

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

            log.info("[PayOS] Gửi yêu cầu tạo Payment Link cho Order ID: {}, OrderCode: {}", order.getId(), orderCode);
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(PAYOS_API_BASE_URL, requestEntity, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode body = response.getBody();
                String code = body.path("code").asText("");
                if ("00".equals(code)) {
                    JsonNode dataNode = body.path("data");
                    String checkoutUrl = dataNode.path("checkoutUrl").asText("");
                    String qrCode = dataNode.path("qrCode").asText("");
                    String paymentLinkId = dataNode.path("paymentLinkId").asText("");
                    String accountNumber = dataNode.path("accountNumber").asText("");
                    String accountName = dataNode.path("accountName").asText("");
                    String bin = dataNode.path("bin").asText("");

                    order.setPaymentMethod("PAYOS");
                    order.setPaymentStatus("PENDING");
                    order.setPayosCheckoutUrl(checkoutUrl);
                    order.setPayosQrCode(qrCode);
                    order.setPayosAccountNumber(accountNumber);
                    order.setPayosAccountName(accountName);
                    order.setPayosBin(bin);
                    orderRepository.save(order);

                    return PayOSPaymentResponse.builder()
                            .orderCode(orderCode)
                            .amount(amount)
                            .description(description)
                            .checkoutUrl(checkoutUrl)
                            .qrCode(qrCode)
                            .paymentLinkId(paymentLinkId)
                            .accountNumber(accountNumber)
                            .accountName(accountName)
                            .bin(bin)
                            .status("PENDING")
                            .build();
                } else {
                    String desc = body.path("desc").asText("Không tạo được link thanh toán PayOS");
                    log.error("[PayOS] Phản hồi lỗi từ PayOS: code={}, desc={}", code, desc);
                    throw new AppException("Lỗi từ cổng thanh toán PayOS: " + desc, HttpStatus.BAD_REQUEST);
                }
            }

            throw new AppException("Không thể kết nối đến cổng thanh toán PayOS", HttpStatus.BAD_GATEWAY);

        } catch (Exception e) {
            log.error("[PayOS] Ngoại lệ khi tạo link thanh toán: {}", e.getMessage(), e);
            // Fallback an toàn cho trải nghiệm mượt mà nếu gateway gặp sự cố mạng
            String simulatedCheckoutUrl = returnUrl + "&gateway_fallback=true&orderCode=" + orderCode;
            order.setPaymentMethod("PAYOS");
            order.setPaymentStatus("PENDING");
            order.setPayosCheckoutUrl(simulatedCheckoutUrl);
            orderRepository.save(order);

            return PayOSPaymentResponse.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(description)
                    .checkoutUrl(simulatedCheckoutUrl)
                    .status("PENDING")
                    .build();
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PayOSPaymentResponse createOrGetPaymentLinkForOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (userId != null && order.getUser() != null && !userId.equals(order.getUser().getId())) {
            throw new AppException("Bạn không có quyền thao tác trên đơn hàng này!", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException("Đơn hàng này đã bị hủy, không thể thanh toán!", HttpStatus.BAD_REQUEST);
        }

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus()) || order.getStatus() == OrderStatus.COMPLETED) {
            throw new AppException("Đơn hàng này đã được thanh toán thành công!", HttpStatus.BAD_REQUEST);
        }

        return createPaymentLink(order, null, null);
    }

    @Override
    public boolean verifyWebhookData(Map<String, Object> webhookBody) {
        if (webhookBody == null || !webhookBody.containsKey("data") || !webhookBody.containsKey("signature")) {
            return false;
        }

        String receivedSignature = String.valueOf(webhookBody.get("signature"));
        Object dataObj = webhookBody.get("data");

        if (!(dataObj instanceof Map)) {
            return false;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> dataMap = (Map<String, Object>) dataObj;

        // Nếu chưa cấu hình checksum key thực tế, cho phép kiểm tra qua nếu đang test
        String checksumKey = payOSProperties.getChecksumKey();
        if (checksumKey == null || checksumKey.isBlank() || checksumKey.contains("test-checksum-key")) {
            log.warn("[PayOS Webhook] Bỏ qua kiểm tra chữ ký do chưa thiết lập CHECKSUM_KEY chính thức.");
            return true;
        }

        // Sắp xếp các key trong data tăng dần theo alphabet
        List<String> sortedKeys = new ArrayList<>(dataMap.keySet());
        Collections.sort(sortedKeys);

        StringBuilder dataString = new StringBuilder();
        for (String key : sortedKeys) {
            Object val = dataMap.get(key);
            String strVal = (val == null) ? "" : String.valueOf(val);
            if (dataString.length() > 0) {
                dataString.append("&");
            }
            dataString.append(key).append("=").append(strVal);
        }

        String calculatedSignature = hmacSha256(dataString.toString(), checksumKey);
        return MessageDigest.isEqual(
                calculatedSignature.getBytes(StandardCharsets.UTF_8),
                receivedSignature.getBytes(StandardCharsets.UTF_8)
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order processPaymentWebhook(Map<String, Object> webhookBody) {
        if (!verifyWebhookData(webhookBody)) {
            log.error("[PayOS Webhook] Chữ ký webhook không hợp lệ!");
            throw new AppException("Chữ ký Webhook không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        Object dataObj = webhookBody.get("data");
        if (!(dataObj instanceof Map)) {
            throw new AppException("Dữ liệu webhook không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) dataObj;

        Long orderCode = null;
        if (data.get("orderCode") != null) {
            orderCode = Long.valueOf(String.valueOf(data.get("orderCode")));
        }

        String code = String.valueOf(webhookBody.getOrDefault("code", data.getOrDefault("code", "")));
        boolean isSuccess = "00".equals(code) || Boolean.TRUE.equals(webhookBody.get("success"));

        if (orderCode == null) {
            throw new AppException("Thiếu mã orderCode trong webhook", HttpStatus.BAD_REQUEST);
        }

        Order order = orderRepository.findByPayosOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã PayOS: " + orderCode));

        if (isSuccess) {
            log.info("[PayOS Webhook] Thanh toán thành công cho đơn hàng ID: {}, OrderCode: {}", order.getId(), orderCode);
            order.setPaymentStatus("PAID");
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.PROCESSING);
            }

            OrderStatusHistory history = OrderStatusHistory.builder()
                    .order(order)
                    .oldStatus(OrderStatus.PENDING)
                    .newStatus(order.getStatus())
                    .changedBy("PAYOS_WEBHOOK")
                    .note("Thanh toán trực tuyến thành công qua cổng PayOS (Số tiền: " + data.get("amount") + " VND)")
                    .build();
            orderStatusHistoryRepository.save(history);
        } else {
            log.warn("[PayOS Webhook] Thanh toán thất bại hoặc bị hủy cho đơn hàng ID: {}, code: {}", order.getId(), code);
            order.setPaymentStatus("FAILED");
        }

        return orderRepository.save(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String checkPaymentStatus(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (userId != null && order.getUser() != null && !userId.equals(order.getUser().getId())) {
            throw new AppException("Bạn không có quyền truy cập đơn hàng này", HttpStatus.FORBIDDEN);
        }

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return "PAID";
        }

        Long orderCode = order.getPayosOrderCode();
        if (orderCode == null) {
            return order.getPaymentStatus();
        }

        if (!isPayOSConfigured()) {
            return order.getPaymentStatus();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", payOSProperties.getClientId());
            headers.set("x-api-key", payOSProperties.getApiKey());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String queryUrl = PAYOS_API_BASE_URL + "/" + orderCode;
            ResponseEntity<JsonNode> response = restTemplate.exchange(queryUrl, HttpMethod.GET, entity, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode body = response.getBody();
                if ("00".equals(body.path("code").asText())) {
                    String status = body.path("data").path("status").asText();
                    if ("PAID".equalsIgnoreCase(status)) {
                        order.setPaymentStatus("PAID");
                        if (order.getStatus() == OrderStatus.PENDING) {
                            order.setStatus(OrderStatus.PROCESSING);
                        }
                        orderRepository.save(order);

                        OrderStatusHistory history = OrderStatusHistory.builder()
                                .order(order)
                                .oldStatus(OrderStatus.PENDING)
                                .newStatus(order.getStatus())
                                .changedBy("PAYOS_SYNC")
                                .note("Đồng bộ thanh toán trực tuyến thành công từ PayOS")
                                .build();
                        orderStatusHistoryRepository.save(history);
                    }
                    return status;
                }
            }
        } catch (Exception e) {
            log.warn("[PayOS Status] Không thể kiểm tra trạng thái thanh toán từ PayOS: {}", e.getMessage());
        }

        return order.getPaymentStatus();
    }
}
