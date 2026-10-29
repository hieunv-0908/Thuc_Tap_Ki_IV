package com.funnyshop.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCheckoutRequest {

    @NotBlank(message = "Họ và tên người nhận không được để trống")
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
    @JsonAlias({"customerName"})
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không hợp lệ (ví dụ: 0912345678)")
    private String phone;

    @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
    @Size(min = 10, max = 500, message = "Địa chỉ giao hàng phải có tối thiểu 10 ký tự")
    @JsonAlias({"shippingAddress"})
    private String address;

    @Builder.Default
    private String paymentMethod = "COD";

    @NotEmpty(message = "Danh sách sản phẩm đặt hàng không được để trống")
    private List<@Valid OrderCheckoutItemRequest> items;
}

