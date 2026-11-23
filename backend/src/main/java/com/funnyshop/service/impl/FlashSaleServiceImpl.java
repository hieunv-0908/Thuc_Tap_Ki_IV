package com.funnyshop.service.impl;

import com.funnyshop.dto.request.FlashSaleItemRequest;
import com.funnyshop.dto.request.FlashSaleRequest;
import com.funnyshop.dto.response.FlashSaleItemResponse;
import com.funnyshop.dto.response.FlashSaleResponse;
import com.funnyshop.entity.FlashSale;
import com.funnyshop.entity.FlashSaleItem;
import com.funnyshop.entity.Product;
import com.funnyshop.enums.FlashSaleScope;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.FlashSaleItemRepository;
import com.funnyshop.repository.FlashSaleRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlashSaleServiceImpl implements FlashSaleService {

    private final FlashSaleRepository flashSaleRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public FlashSaleResponse createFlashSale(FlashSaleRequest request) {
        validateRequest(request);

        FlashSale flashSale = FlashSale.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .discountPercent(request.getDiscountPercent())
                .scope(request.getScope())
                .categoryIds(request.getCategoryIds() != null ? new ArrayList<>(request.getCategoryIds()) : new ArrayList<>())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .items(new ArrayList<>())
                .build();

        if (request.getScope() == FlashSaleScope.PRODUCT && request.getItems() != null) {
            for (FlashSaleItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + itemReq.getProductId()));

                FlashSaleItem item = FlashSaleItem.builder()
                        .flashSale(flashSale)
                        .product(product)
                        .discountPercent(itemReq.getDiscountPercent() != null ? itemReq.getDiscountPercent() : request.getDiscountPercent())
                        .flashSaleStock(itemReq.getFlashSaleStock() != null && itemReq.getFlashSaleStock() > 0 ? itemReq.getFlashSaleStock() : 50)
                        .soldCount(0)
                        .build();

                flashSale.getItems().add(item);
            }
        }

        FlashSale saved = flashSaleRepository.save(flashSale);
        return mapToResponse(saved, true);
    }

    @Override
    @Transactional
    public FlashSaleResponse updateFlashSale(Long id, FlashSaleRequest request) {
        validateRequest(request);

        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chiến dịch Flash Sale với ID: " + id));

        flashSale.setName(request.getName().trim());
        flashSale.setDescription(request.getDescription());
        flashSale.setStartTime(request.getStartTime());
        flashSale.setEndTime(request.getEndTime());
        flashSale.setDiscountPercent(request.getDiscountPercent());
        flashSale.setScope(request.getScope());
        flashSale.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        flashSale.getCategoryIds().clear();
        if (request.getCategoryIds() != null) {
            flashSale.getCategoryIds().addAll(request.getCategoryIds());
        }

        if (request.getScope() == FlashSaleScope.PRODUCT) {
            flashSale.getItems().clear();
            if (request.getItems() != null) {
                for (FlashSaleItemRequest itemReq : request.getItems()) {
                    Product product = productRepository.findById(itemReq.getProductId())
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + itemReq.getProductId()));

                    FlashSaleItem item = FlashSaleItem.builder()
                            .flashSale(flashSale)
                            .product(product)
                            .discountPercent(itemReq.getDiscountPercent() != null ? itemReq.getDiscountPercent() : request.getDiscountPercent())
                            .flashSaleStock(itemReq.getFlashSaleStock() != null && itemReq.getFlashSaleStock() > 0 ? itemReq.getFlashSaleStock() : 50)
                            .soldCount(0)
                            .build();

                    flashSale.getItems().add(item);
                }
            }
        } else {
            flashSale.getItems().clear();
        }

        FlashSale updated = flashSaleRepository.save(flashSale);
        return mapToResponse(updated, true);
    }

    @Override
    @Transactional
    public void deleteFlashSale(Long id) {
        if (!flashSaleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chiến dịch Flash Sale với ID: " + id);
        }
        flashSaleRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public FlashSaleResponse getFlashSaleById(Long id) {
        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chiến dịch Flash Sale với ID: " + id));
        return mapToResponse(flashSale, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashSaleResponse> getAllFlashSales() {
        return flashSaleRepository.findAll().stream()
                .sorted(Comparator.comparing(FlashSale::getStartTime).reversed())
                .map(fs -> mapToResponse(fs, false))
                .toList();
    }

    @Override
    @Transactional
    public FlashSaleResponse toggleFlashSaleActive(Long id) {
        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chiến dịch Flash Sale với ID: " + id));
        flashSale.setIsActive(!Boolean.TRUE.equals(flashSale.getIsActive()));
        FlashSale saved = flashSaleRepository.save(flashSale);
        return mapToResponse(saved, false);
    }

    @Override
    @Transactional
    public FlashSaleResponse startFlashSaleNow(Long id) {
        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chiến dịch Flash Sale với ID: " + id));
        LocalDateTime now = LocalDateTime.now();
        // Lùi 2 phút để đảm bảo sale ONGOING ngay lập tức không bị lệch vài mili-giây
        flashSale.setStartTime(now.minusMinutes(2));
        if (flashSale.getEndTime() == null || flashSale.getEndTime().isBefore(now.plusMinutes(10))) {
            flashSale.setEndTime(now.plusHours(24));
        }
        flashSale.setIsActive(true);
        FlashSale saved = flashSaleRepository.save(flashSale);
        return mapToResponse(saved, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FlashSaleResponse> getActiveFlashSale() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> activeSales = flashSaleRepository.findActiveFlashSales(now);
        if (activeSales.isEmpty()) {
            return Optional.empty();
        }

        FlashSale activeSale = activeSales.get(0);
        FlashSaleResponse response = mapToResponse(activeSale, true);

        // Nếu là ALL hoặc CATEGORY mà chưa có items trong bảng items, sinh danh sách sản phẩm động
        if (response.getItems() == null || response.getItems().isEmpty()) {
            List<FlashSaleItemResponse> dynamicItems = generateDynamicFlashSaleItems(activeSale);
            response.setItems(dynamicItems);
        }

        return Optional.of(response);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashSaleResponse> getUpcomingFlashSales() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> allSales = flashSaleRepository.findAll();
        List<FlashSaleResponse> result = new ArrayList<>();

        for (FlashSale sale : allSales) {
            if (Boolean.TRUE.equals(sale.getIsActive()) && sale.getStartTime().isAfter(now)) {
                FlashSaleResponse res = mapToResponse(sale, true);
                if (res.getItems() == null || res.getItems().isEmpty()) {
                    res.setItems(generateDynamicFlashSaleItems(sale));
                }
                result.add(res);
            }
        }

        result.sort(Comparator.comparing(FlashSaleResponse::getStartTime));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public int getActiveDiscountPercentForProduct(Long productId, Long categoryId) {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> activeSales = flashSaleRepository.findActiveFlashSales(now);
        if (activeSales.isEmpty()) {
            return 0;
        }

        for (FlashSale sale : activeSales) {
            if (sale.getScope() == FlashSaleScope.ALL) {
                return sale.getDiscountPercent();
            }
            if (sale.getScope() == FlashSaleScope.CATEGORY && categoryId != null) {
                if (sale.getCategoryIds() != null && sale.getCategoryIds().contains(categoryId)) {
                    return sale.getDiscountPercent();
                }
            }
            if (sale.getScope() == FlashSaleScope.PRODUCT && productId != null) {
                Optional<FlashSaleItem> itemOpt = flashSaleItemRepository.findByFlashSaleIdAndProductId(sale.getId(), productId);
                if (itemOpt.isPresent()) {
                    FlashSaleItem item = itemOpt.get();
                    return item.getDiscountPercent() != null ? item.getDiscountPercent() : sale.getDiscountPercent();
                }
            }
        }
        return 0;
    }

    private void validateRequest(FlashSaleRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new AppException("Thời gian bắt đầu phải trước thời gian kết thúc!", HttpStatus.BAD_REQUEST);
        }
        if (request.getScope() == FlashSaleScope.CATEGORY && (request.getCategoryIds() == null || request.getCategoryIds().isEmpty())) {
            throw new AppException("Vui lòng chọn ít nhất 1 danh mục áp dụng Flash Sale!", HttpStatus.BAD_REQUEST);
        }
        if (request.getScope() == FlashSaleScope.PRODUCT && (request.getItems() == null || request.getItems().isEmpty())) {
            throw new AppException("Vui lòng chọn ít nhất 1 sản phẩm áp dụng Flash Sale!", HttpStatus.BAD_REQUEST);
        }
    }

    private List<FlashSaleItemResponse> generateDynamicFlashSaleItems(FlashSale sale) {
        List<FlashSaleItemResponse> result = new ArrayList<>();
        List<Product> products;

        if (sale.getScope() == FlashSaleScope.CATEGORY && !sale.getCategoryIds().isEmpty()) {
            products = new ArrayList<>();
            for (Long catId : sale.getCategoryIds()) {
                var paged = productRepository.searchProducts(null, catId, PageRequest.of(0, 8));
                products.addAll(paged.getContent());
            }
        } else {
            // ALL: Lấy 16 sản phẩm đầu tiên
            var paged = productRepository.searchProducts(null, null, PageRequest.of(0, 16));
            products = paged.getContent();
        }

        for (Product p : products) {
            if (Boolean.TRUE.equals(p.getIsDeleted())) continue;
            BigDecimal origPrice = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
            int discount = sale.getDiscountPercent();
            BigDecimal salePrice = origPrice.multiply(BigDecimal.valueOf(100 - discount))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

            int soldCount = (int) ((p.getId() * 7) % 38) + 12; // Mô phỏng số lượng bán đẹp mắt
            int flashStock = 50;
            int progress = Math.min(100, (soldCount * 100) / flashStock);

            result.add(FlashSaleItemResponse.builder()
                    .id(p.getId())
                    .productId(p.getId())
                    .productName(p.getName())
                    .imageUrl(p.getImageUrl())
                    .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Thời trang")
                    .originalPrice(origPrice)
                    .flashSalePrice(salePrice)
                    .discountPercent(discount)
                    .flashSaleStock(flashStock)
                    .soldCount(soldCount)
                    .progressPercent(progress)
                    .isOutOfStock(p.getStockQuantity() != null && p.getStockQuantity() <= 0)
                    .build());
        }
        return result;
    }

    private FlashSaleResponse mapToResponse(FlashSale flashSale, boolean includeItems) {
        LocalDateTime now = LocalDateTime.now();
        String status;
        long remainingSeconds = 0;

        if (!Boolean.TRUE.equals(flashSale.getIsActive())) {
            status = "PAUSED";
            remainingSeconds = 0;
        } else if (now.isBefore(flashSale.getStartTime())) {
            status = "UPCOMING";
            remainingSeconds = Duration.between(now, flashSale.getStartTime()).getSeconds();
        } else if (now.isAfter(flashSale.getEndTime())) {
            status = "ENDED";
            remainingSeconds = 0;
        } else {
            status = "ONGOING";
            remainingSeconds = Duration.between(now, flashSale.getEndTime()).getSeconds();
        }

        List<FlashSaleItemResponse> itemResponses = new ArrayList<>();
        if (includeItems && flashSale.getItems() != null) {
            for (FlashSaleItem item : flashSale.getItems()) {
                Product p = item.getProduct();
                if (p == null || Boolean.TRUE.equals(p.getIsDeleted())) continue;

                int discount = item.getDiscountPercent() != null ? item.getDiscountPercent() : flashSale.getDiscountPercent();
                BigDecimal origPrice = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
                BigDecimal salePrice = origPrice.multiply(BigDecimal.valueOf(100 - discount))
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                int stock = item.getFlashSaleStock() != null ? item.getFlashSaleStock() : 50;
                int sold = item.getSoldCount() != null ? item.getSoldCount() : 0;
                int progress = stock > 0 ? Math.min(100, (sold * 100) / stock) : 0;

                itemResponses.add(FlashSaleItemResponse.builder()
                        .id(item.getId())
                        .productId(p.getId())
                        .productName(p.getName())
                        .imageUrl(p.getImageUrl())
                        .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : "")
                        .originalPrice(origPrice)
                        .flashSalePrice(salePrice)
                        .discountPercent(discount)
                        .flashSaleStock(stock)
                        .soldCount(sold)
                        .progressPercent(progress)
                        .isOutOfStock(p.getStockQuantity() != null && p.getStockQuantity() <= 0)
                        .build());
            }
        }

        return FlashSaleResponse.builder()
                .id(flashSale.getId())
                .name(flashSale.getName())
                .description(flashSale.getDescription())
                .startTime(flashSale.getStartTime())
                .endTime(flashSale.getEndTime())
                .discountPercent(flashSale.getDiscountPercent())
                .scope(flashSale.getScope())
                .categoryIds(flashSale.getCategoryIds() != null ? new ArrayList<>(flashSale.getCategoryIds()) : new ArrayList<>())
                .isActive(flashSale.getIsActive())
                .status(status)
                .remainingSeconds(remainingSeconds)
                .items(itemResponses)
                .createdAt(flashSale.getCreatedAt())
                .updatedAt(flashSale.getUpdatedAt())
                .build();
    }
}

