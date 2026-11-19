package com.funnyshop.service;

import com.funnyshop.dto.request.FeedbackCreateRequest;
import com.funnyshop.dto.request.FeedbackReplyRequest;
import com.funnyshop.dto.request.FeedbackStatusUpdateRequest;
import com.funnyshop.dto.response.FeedbackResponse;
import com.funnyshop.enums.FeedbackStatus;
import com.funnyshop.enums.FeedbackType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface FeedbackService {

    // Phía khách hàng
    FeedbackResponse createFeedback(Long userId, FeedbackCreateRequest request);
    Page<FeedbackResponse> getMyFeedbacks(Long userId, FeedbackStatus status, Pageable pageable);
    FeedbackResponse getMyFeedbackDetail(Long userId, Long feedbackId);

    // Phía Admin
    Page<FeedbackResponse> getAllFeedbacks(FeedbackStatus status, FeedbackType type, String keyword, Pageable pageable);
    FeedbackResponse getFeedbackById(Long id);
    FeedbackResponse replyFeedback(Long adminId, Long feedbackId, FeedbackReplyRequest request);
    FeedbackResponse updateStatus(Long feedbackId, FeedbackStatusUpdateRequest request);
    void deleteFeedback(Long feedbackId);
    Map<String, Long> getFeedbackStats();
}

