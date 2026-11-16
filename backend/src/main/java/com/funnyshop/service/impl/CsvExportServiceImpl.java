package com.funnyshop.service.impl;

import com.funnyshop.entity.Order;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.ProductVariant;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.CsvExportService;
import com.funnyshop.util.CsvExportUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.Writer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvExportServiceImpl implements CsvExportService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public void exportOrdersToCsv(
            Writer writer,
            String search,
            OrderStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) throws IOException {
        log.info("Bắt đầu xuất CSV đơn hàng: search={}, status={}, startDate={}, endDate={}",
                search, status, startDate, endDate);

        // 1. Ghi ký tự UTF-8 BOM
        CsvExportUtil.writeBom(writer);

        // 2. Ghi tiêu đề các cột (Header)
        CsvExportUtil.writeRow(
                writer,
                "Mã đơn hàng",
                "Ngày đặt hàng",
                "Tên khách hàng",
                "Số điện thoại",
                "Địa chỉ nhận hàng",
                "Phương thức thanh toán",
                "Trạng thái đơn hàng",
                "Danh sách sản phẩm",
                "Tạm tính (VNĐ)",
                "Mã Voucher",
                "Tiền giảm giá (VNĐ)",
                "Tổng thanh toán (VNĐ)"
        );

        // 3. Truy vấn danh sách đơn hàng
        List<Order> orders = orderRepository.findOrdersForExport(search, status, startDate, endDate);

        // 4. Ghi từng dòng dữ liệu
        for (Order order : orders) {
            String productSummary = "";
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                productSummary = order.getOrderItems().stream()
                        .map(oi -> {
                            String pName = oi.getProduct() != null ? oi.getProduct().getName() : "Sản phẩm";
                            String variantDetails = "";
                            if (oi.getProductVariant() != null) {
                                String color = oi.getProductVariant().getColor();
                                String size = oi.getProductVariant().getSize();
                                if (color != null || size != null) {
                                    variantDetails = " (" + (color != null ? color : "")
                                            + (size != null ? " - " + size : "") + ")";
                                }
                            }
                            return pName + variantDetails + " x" + oi.getQuantity();
                        })
                        .collect(Collectors.joining("; "));
            }

            CsvExportUtil.writeRow(
                    writer,
                    "#" + order.getId(),
                    CsvExportUtil.formatDateTime(order.getCreatedAt()),
                    order.getCustomerName(),
                    order.getPhone(),
                    order.getShippingAddress(),
                    order.getPaymentMethod() != null ? order.getPaymentMethod() : "COD",
                    CsvExportUtil.getOrderStatusLabel(order.getStatus()),
                    productSummary,
                    CsvExportUtil.formatCurrency(order.getSubtotalAmount() != null
                            ? order.getSubtotalAmount() : order.getTotalAmount()),
                    order.getVoucherCode() != null ? order.getVoucherCode() : "",
                    CsvExportUtil.formatCurrency(order.getDiscountAmount()),
                    CsvExportUtil.formatCurrency(order.getTotalAmount())
            );
        }

        writer.flush();
        log.info("Xuất thành công {} đơn hàng ra CSV.", orders.size());
    }

    @Override
    @Transactional(readOnly = true)
    public void exportProductsToCsv(
            Writer writer,
            String keyword,
            Long categoryId,
            Boolean isDeleted
    ) throws IOException {
        log.info("Bắt đầu xuất CSV sản phẩm: keyword={}, categoryId={}, isDeleted={}",
                keyword, categoryId, isDeleted);

        // 1. Ghi ký tự UTF-8 BOM
        CsvExportUtil.writeBom(writer);

        // 2. Ghi tiêu đề các cột (Header)
        CsvExportUtil.writeRow(
                writer,
                "ID Sản phẩm",
                "Tên sản phẩm",
                "Danh mục",
                "Thương hiệu",
                "Chất liệu",
                "Đối tượng",
                "Mã SKU biến thể",
                "Màu sắc",
                "Kích cỡ",
                "Giá bán (VNĐ)",
                "Tồn kho (Chiếc)",
                "Trạng thái kinh doanh",
                "Ngày tạo"
        );

        // 3. Truy vấn danh sách sản phẩm
        List<Product> products = productRepository.findProductsForExport(keyword, categoryId, isDeleted);

        // 4. Ghi từng dòng dữ liệu
        for (Product product : products) {
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "";
            String status = Boolean.TRUE.equals(product.getIsDeleted()) ? "Đã ẩn" : "Đang bán";
            String createdAt = CsvExportUtil.formatDateTime(product.getCreatedAt());

            List<ProductVariant> variants = product.getVariants();
            if (variants != null && !variants.isEmpty()) {
                for (ProductVariant variant : variants) {
                    CsvExportUtil.writeRow(
                            writer,
                            product.getId(),
                            product.getName(),
                            categoryName,
                            product.getBrand() != null ? product.getBrand() : "",
                            product.getMaterial() != null ? product.getMaterial() : "",
                            product.getGenderType() != null ? product.getGenderType() : "",
                            variant.getSku() != null ? variant.getSku() : "",
                            variant.getColor() != null ? variant.getColor() : "",
                            variant.getSize() != null ? variant.getSize() : "",
                            CsvExportUtil.formatCurrency(variant.getPrice()),
                            variant.getStockQuantity() != null ? variant.getStockQuantity() : 0,
                            status,
                            createdAt
                    );
                }
            } else {
                // Sản phẩm không có biến thể cụ thể
                CsvExportUtil.writeRow(
                        writer,
                        product.getId(),
                        product.getName(),
                        categoryName,
                        product.getBrand() != null ? product.getBrand() : "",
                        product.getMaterial() != null ? product.getMaterial() : "",
                        product.getGenderType() != null ? product.getGenderType() : "",
                        "",
                        "",
                        "",
                        CsvExportUtil.formatCurrency(product.getPrice()),
                        product.getStockQuantity() != null ? product.getStockQuantity() : 0,
                        status,
                        createdAt
                );
            }
        }

        writer.flush();
        log.info("Xuất thành công {} sản phẩm ra CSV.", products.size());
    }
}

