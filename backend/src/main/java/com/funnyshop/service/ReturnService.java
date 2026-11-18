package com.funnyshop.service;

import com.funnyshop.dto.request.ReturnCreateRequest;
import com.funnyshop.dto.request.ReturnReviewRequest;
import com.funnyshop.dto.response.ReturnResponse;
import com.funnyshop.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReturnService {

    ReturnResponse createReturnRequest(Long userId, Long orderId, ReturnCreateRequest request);

    ReturnResponse getReturnRequestByOrderId(Long userId, Long orderId, boolean isAdmin);

    ReturnResponse getReturnRequestById(Long returnId);

    Page<ReturnResponse> getAllReturnRequests(String keyword, ReturnStatus status, Pageable pageable);

    ReturnResponse reviewReturnRequest(Long returnId, ReturnReviewRequest request);

    ReturnResponse completeReturn(Long returnId, String note);
}

