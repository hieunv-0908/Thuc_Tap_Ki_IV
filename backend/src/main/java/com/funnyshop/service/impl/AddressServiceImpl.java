package com.funnyshop.service.impl;

import com.funnyshop.dto.request.AddressRequest;
import com.funnyshop.dto.response.AddressResponse;
import com.funnyshop.entity.Address;
import com.funnyshop.entity.User;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.AddressRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.AddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressDetail(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ không tồn tại với ID: " + addressId));
        return AddressResponse.fromEntity(address);
    }

    @Override
    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        long count = addressRepository.countByUserId(userId);
        boolean isDefault = Boolean.TRUE.equals(request.getIsDefault()) || count == 0;

        if (isDefault) {
            addressRepository.resetDefaultAddressForUser(userId);
        }

        Address address = Address.builder()
                .user(user)
                .recipientName(request.getRecipientName().trim())
                .phone(request.getPhone().trim())
                .province(request.getProvince().trim())
                .district(request.getDistrict().trim())
                .ward(request.getWard().trim())
                .detailAddress(request.getDetailAddress().trim())
                .isDefault(isDefault)
                .addressType(request.getAddressType() != null ? request.getAddressType() : "HOME")
                .build();

        Address saved = addressRepository.save(address);
        log.info("User {} created address {}", userId, saved.getId());
        return AddressResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ không tồn tại với ID: " + addressId));

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.resetDefaultAddressForUser(userId);
            address.setIsDefault(true);
        }

        address.setRecipientName(request.getRecipientName().trim());
        address.setPhone(request.getPhone().trim());
        address.setProvince(request.getProvince().trim());
        address.setDistrict(request.getDistrict().trim());
        address.setWard(request.getWard().trim());
        address.setDetailAddress(request.getDetailAddress().trim());
        if (request.getAddressType() != null) {
            address.setAddressType(request.getAddressType());
        }
        address.setUpdatedAt(LocalDateTime.now());

        Address saved = addressRepository.save(address);
        log.info("User {} updated address {}", userId, saved.getId());
        return AddressResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ không tồn tại với ID: " + addressId));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);
        log.info("User {} deleted address {}", userId, addressId);

        if (wasDefault) {
            // Đặt địa chỉ gần nhất còn lại làm mặc định
            List<Address> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address first = remaining.get(0);
                first.setIsDefault(true);
                addressRepository.save(first);
            }
        }
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ không tồn tại với ID: " + addressId));

        addressRepository.resetDefaultAddressForUser(userId);
        address.setIsDefault(true);
        address.setUpdatedAt(LocalDateTime.now());

        Address saved = addressRepository.save(address);
        log.info("User {} set address {} as default", userId, addressId);
        return AddressResponse.fromEntity(saved);
    }
}

