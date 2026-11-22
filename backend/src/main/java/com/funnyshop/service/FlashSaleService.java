package com.funnyshop.service;

import com.funnyshop.dto.request.FlashSaleRequest;
import com.funnyshop.dto.response.FlashSaleResponse;

import java.util.List;
import java.util.Optional;

public interface FlashSaleService {

    FlashSaleResponse createFlashSale(FlashSaleRequest request);

    FlashSaleResponse updateFlashSale(Long id, FlashSaleRequest request);

    void deleteFlashSale(Long id);

    FlashSaleResponse getFlashSaleById(Long id);

    List<FlashSaleResponse> getAllFlashSales();

    FlashSaleResponse toggleFlashSaleActive(Long id);

    Optional<FlashSaleResponse> getActiveFlashSale();

    int getActiveDiscountPercentForProduct(Long productId, Long categoryId);
}

