package com.funnyshop;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class FunnyShopApplication {

    @PostConstruct
    public void init() {
        // Đặt múi giờ toàn ứng dụng mặc định là GMT+7 (Việt Nam) bất kể chạy trên localhost hay VPS nước ngoài
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }

    public static void main(String[] args) {
        SpringApplication.run(FunnyShopApplication.class, args);
    }

}

    