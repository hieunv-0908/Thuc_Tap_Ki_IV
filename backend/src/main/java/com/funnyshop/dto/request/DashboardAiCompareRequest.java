package com.funnyshop.dto.request;

import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAiCompareRequest {

    private String preset; // "TODAY_VS_YESTERDAY", "THIS_WEEK_VS_LAST_WEEK", "THIS_MONTH_VS_LAST_MONTH", "THIS_YEAR_VS_LAST_YEAR", "CUSTOM"

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateA;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDateA;

    private String labelA;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateB;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDateB;

    private String labelB;
}

