package com.funnyshop.exception;

import org.springframework.http.HttpStatus;

public class InsufficientStockException extends AppException {

    private final String productName;
    private final Integer requestedQuantity;
    private final Integer availableStock;

    public InsufficientStockException(String productName, Integer requestedQuantity, Integer availableStock) {
        super(
                String.format("Sản phẩm '%s' không đủ số lượng tồn kho (hiện còn: %d, yêu cầu: %d)!",
                        productName, availableStock != null ? availableStock : 0, requestedQuantity),
                HttpStatus.BAD_REQUEST
        );
        this.productName = productName;
        this.requestedQuantity = requestedQuantity;
        this.availableStock = availableStock;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }
}

