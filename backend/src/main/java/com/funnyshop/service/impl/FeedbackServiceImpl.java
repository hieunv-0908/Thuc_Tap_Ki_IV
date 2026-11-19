package com.funnyshop.service.impl;

import com.funnyshop.dto.request.FeedbackCreateRequest;
import com.funnyshop.dto.request.FeedbackReplyRequest;
import com.funnyshop.dto.request.FeedbackStatusUpdateRequest;
import com.funnyshop.dto.request.NotificationCreateRequest;
import com.funnyshop.dto.response.FeedbackResponse;
import com.funnyshop.entity.Feedback;
import com.funnyshop.entity.User;
import com.funnyshop.enums.FeedbackStatus;
import com.funnyshop.enums.FeedbackType;
import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import com.funnyshop.exception.AppException;
import com.funnyshop.repository.FeedbackRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.FeedbackService;
import com.funnyshop.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public FeedbackResponse createFeedback(Long userId, FeedbackCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Người dùng không tồn tại!", HttpStatus.NOT_FOUND));

        Feedback feedback = Feedback.builder()
                .user(user)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .type(request.getType() != null ? request.getType() : FeedbackType.OTHER)
                .status(FeedbackStatus.PENDING)
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedbackResponse> getMyFeedbacks(Long userId, FeedbackStatus status, Pageable pageable) {
        Page<Feedback> pageResult;
        if (status != null) {
            pageResult = feedbackRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            pageResult = feedbackRepository.findByUserId(userId, pageable);
        }
        return pageResult.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackResponse getMyFeedbackDetail(Long userId, Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException("Không tìm thấy phản hồi này!", HttpStatus.NOT_FOUND));

        if (!feedback.getUser().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền xem phản hồi này!", HttpStatus.FORBIDDEN);
        }

        return mapToResponse(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedbackResponse> getAllFeedbacks(FeedbackStatus status, FeedbackType type, String keyword, Pageable pageable) {
        String trimmedKw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        Page<Feedback> pageResult = feedbackRepository.findAllWithFilter(status, type, trimmedKw, pageable);
        return pageResult.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackById(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new AppException("Không tìm thấy phản hồi ID: " + id, HttpStatus.NOT_FOUND));
        return mapToResponse(feedback);
    }

    @Override
    @Transactional
    public FeedbackResponse replyFeedback(Long adminId, Long feedbackId, FeedbackReplyRequest request) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException("Không tìm thấy phản hồi ID: " + feedbackId, HttpStatus.NOT_FOUND));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException("Tài khoản admin không tồn tại!", HttpStatus.NOT_FOUND));

        feedback.setAdminReply(request.getReply().trim());
        feedback.setRepliedBy(admin);
        feedback.setRepliedAt(LocalDateTime.now());
        feedback.setStatus(request.getStatus() != null ? request.getStatus() : FeedbackStatus.REPLIED);

        Feedback saved = feedbackRepository.save(feedback);

        // Tự động gửi thông báo hệ thống tới người dùng
        try {
            String snippet = request.getReply().trim();
            if (snippet.length() > 90) {
                snippet = snippet.substring(0, 90) + "...";
            }
            NotificationCreateRequest notiRequest = NotificationCreateRequest.builder()
                    .title("Admin đã phản hồi góp ý của bạn!")
                    .content("Góp ý \"" + feedback.getTitle() + "\" đã nhận được phản hồi: " + snippet)
                    .type(NotificationType.FEEDBACK)
                    .target(NotificationTarget.SPECIFIC)
                    .userId(feedback.getUser().getId())
                    .targetUrl("/feedback")
                    .isActive(true)
                    .build();
            notificationService.createNotification(notiRequest);
        } catch (Exception e) {
            log.error("Lỗi khi tự động gửi thông báo phản hồi feedback: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public FeedbackResponse updateStatus(Long feedbackId, FeedbackStatusUpdateRequest request) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException("Không tìm thấy phản hồi ID: " + feedbackId, HttpStatus.NOT_FOUND));

        feedback.setStatus(request.getStatus());
        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException("Không tìm thấy phản hồi ID: " + feedbackId, HttpStatus.NOT_FOUND));
        feedbackRepository.delete(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getFeedbackStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", feedbackRepository.count());
        stats.put("pending", feedbackRepository.countByStatus(FeedbackStatus.PENDING));
        stats.put("processing", feedbackRepository.countByStatus(FeedbackStatus.PROCESSING));
        stats.put("replied", feedbackRepository.countByStatus(FeedbackStatus.REPLIED));
        stats.put("closed", feedbackRepository.countByStatus(FeedbackStatus.CLOSED));
        return stats;
    }

    private FeedbackResponse mapToResponse(Feedback f) {
        User u = f.getUser();
        User admin = f.getRepliedBy();

        return FeedbackResponse.builder()
                .id(f.getId())
                .userId(u != null ? u.getId() : null)
                .username(u != null ? u.getUsername() : "Ẩn danh")
                .userFullName(u != null ? (u.getFullName() != null ? u.getFullName() : u.getUsername()) : "Ẩn danh")
                .userEmail(u != null ? u.getEmail() : "")
                .title(f.getTitle())
                .content(f.getContent())
                .type(f.getType())
                .typeLabel(f.getType() != null ? f.getType().getLabel() : "Khác")
                .status(f.getStatus())
                .statusLabel(f.getStatus() != null ? f.getStatus().getLabel() : "Chờ phản hồi")
                .adminReply(f.getAdminReply())
                .repliedById(admin != null ? admin.getId() : null)
                .repliedByName(admin != null ? (admin.getFullName() != null ? admin.getFullName() : admin.getUsername()) : null)
                .repliedAt(f.getRepliedAt())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}

