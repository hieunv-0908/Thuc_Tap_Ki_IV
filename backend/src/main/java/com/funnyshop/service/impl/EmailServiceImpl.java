package com.funnyshop.service.impl;

import com.funnyshop.event.OrderCancelledEvent;
import com.funnyshop.event.OrderCreatedEvent;
import com.funnyshop.event.OrderItemEventDto;
import com.funnyshop.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:funnyshops367@gmail.com}")
    private String senderEmail;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    @Override
    public void sendOrderConfirmationEmail(OrderCreatedEvent event) {
        String recipient = event.getUserEmail();
        if (recipient == null || recipient.isBlank()) {
            log.info("[Email] Đơn hàng #{} không có email khách hàng, bỏ qua gửi mail xác nhận.", event.getOrderId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, "FunnyShop");
            helper.setTo(recipient);
            helper.setSubject("🎉 [FunnyShop] Xác nhận đơn hàng thành công #" + event.getOrderId());

            StringBuilder itemsHtml = new StringBuilder();
            if (event.getItems() != null) {
                for (OrderItemEventDto item : event.getItems()) {
                    String formattedPrice = (item.getPrice() != null) ? CURRENCY_FORMAT.format(item.getPrice()) : "0 đ";
                    itemsHtml.append("<tr>")
                            .append("<td style='padding: 8px; border-bottom: 1px solid #eee;'>")
                            .append("<strong>").append(item.getProductName() != null ? item.getProductName() : "Sản phẩm").append("</strong><br/>")
                            .append("<small style='color: #666;'>Phân loại: ").append(item.getColor()).append(" - ").append(item.getSize()).append("</small>")
                            .append("</td>")
                            .append("<td style='padding: 8px; border-bottom: 1px solid #eee; text-align: center;'>").append(item.getQuantity()).append("</td>")
                            .append("<td style='padding: 8px; border-bottom: 1px solid #eee; text-align: right;'>").append(formattedPrice).append("</td>")
                            .append("</tr>");
                }
            }

            String formattedTotal = (event.getTotalAmount() != null) ? CURRENCY_FORMAT.format(event.getTotalAmount()) : "0 đ";
            String formattedDate = (event.getCreatedAt() != null) ? event.getCreatedAt().format(DATE_FORMATTER) : "";

            String htmlContent = """
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                        <div style='background-color: #ff5722; color: #fff; padding: 20px; text-align: center;'>
                            <h2 style='margin: 0;'>FunnyShop - Đặt hàng thành công!</h2>
                        </div>
                        <div style='padding: 24px; color: #333;'>
                            <p>Xin chào <strong>%s</strong>,</p>
                            <p>Cảm ơn bạn đã mua sắm tại <strong>FunnyShop</strong>. Đơn hàng <strong>#%d</strong> của bạn đã được tiếp nhận và đang được chuẩn bị để đóng gói.</p>
                            
                            <div style='background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0;'>
                                <p style='margin: 4px 0;'><strong>Mã đơn hàng:</strong> #%d</p>
                                <p style='margin: 4px 0;'><strong>Thời gian:</strong> %s</p>
                                <p style='margin: 4px 0;'><strong>Địa chỉ nhận hàng:</strong> %s</p>
                                <p style='margin: 4px 0;'><strong>Số điện thoại:</strong> %s</p>
                                <p style='margin: 4px 0;'><strong>Phương thức thanh toán:</strong> %s</p>
                            </div>

                            <table style='width: 100%%; border-collapse: collapse; margin-top: 16px;'>
                                <thead>
                                    <tr style='background-color: #f0f0f0;'>
                                        <th style='padding: 8px; text-align: left;'>Sản phẩm</th>
                                        <th style='padding: 8px; text-align: center;'>Số lượng</th>
                                        <th style='padding: 8px; text-align: right;'>Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    %s
                                </tbody>
                            </table>

                            <div style='text-align: right; margin-top: 20px; font-size: 16px;'>
                                <p><strong>Tổng thanh toán: <span style='color: #ff5722; font-size: 20px;'>%s</span></strong></p>
                            </div>

                            <hr style='border: none; border-top: 1px solid #eee; margin: 24px 0;'/>
                            <p style='color: #666; font-size: 13px;'>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hỗ trợ hoặc hotline.</p>
                        </div>
                    </div>
                    """.formatted(
                    event.getCustomerName() != null ? event.getCustomerName() : "Quý khách",
                    event.getOrderId(),
                    event.getOrderId(),
                    formattedDate,
                    event.getShippingAddress() != null ? event.getShippingAddress() : "",
                    event.getPhone() != null ? event.getPhone() : "",
                    event.getPaymentMethod() != null ? event.getPaymentMethod() : "COD",
                    itemsHtml.toString(),
                    formattedTotal
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[Email] Đã gửi email xác nhận thành công cho đơn hàng #{} tới {}", event.getOrderId(), recipient);

        } catch (Exception ex) {
            log.error("[Email] Không thể gửi email xác nhận cho đơn hàng #{}: {}", event.getOrderId(), ex.getMessage());
        }
    }

    @Override
    public void sendOrderCancelledEmail(OrderCancelledEvent event) {
        String recipient = event.getUserEmail();
        if (recipient == null || recipient.isBlank()) {
            log.info("[Email] Đơn hàng #{} bị hủy không có email người nhận, bỏ qua.", event.getOrderId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, "FunnyShop");
            helper.setTo(recipient);
            helper.setSubject("⚠️ [FunnyShop] Thông báo hủy đơn hàng #" + event.getOrderId());

            String formattedDate = (event.getCancelledAt() != null) ? event.getCancelledAt().format(DATE_FORMATTER) : "";
            String formattedTotal = (event.getTotalAmount() != null) ? CURRENCY_FORMAT.format(event.getTotalAmount()) : "0 đ";
            String reasonHtml = (event.getCancelReason() != null && !event.getCancelReason().isBlank())
                    ? "<p style='background-color: #f8f9fa; padding: 10px 14px; border-left: 4px solid #dc3545; margin: 16px 0; border-radius: 4px;'><strong>Lý do hủy:</strong> " + event.getCancelReason() + "</p>"
                    : "";

            String htmlContent = """
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                        <div style='background-color: #757575; color: #fff; padding: 20px; text-align: center;'>
                            <h2 style='margin: 0;'>FunnyShop - Thông báo hủy đơn</h2>
                        </div>
                        <div style='padding: 24px; color: #333;'>
                            <p>Xin chào <strong>%s</strong>,</p>
                            <p>Đơn hàng <strong>#%d</strong> trị giá <strong>%s</strong> của bạn đã được hủy thành công vào lúc <strong>%s</strong>.</p>
                            %s
                            <p>Tồn kho sản phẩm trong đơn đã được tự động hoàn lại hệ thống.</p>
                            <p style='color: #666; font-size: 13px; margin-top: 24px;'>Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ ngay với bộ phận CSKH của chúng tôi để được hỗ trợ kịp thời.</p>
                        </div>
                    </div>
                    """.formatted(
                    event.getCustomerName() != null ? event.getCustomerName() : "Quý khách",
                    event.getOrderId(),
                    formattedTotal,
                    formattedDate,
                    reasonHtml
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[Email] Đã gửi thông báo hủy đơn hàng #{} tới {}", event.getOrderId(), recipient);

        } catch (Exception ex) {
            log.error("[Email] Không thể gửi email thông báo hủy đơn #{}: {}", event.getOrderId(), ex.getMessage());
        }
    }
}

