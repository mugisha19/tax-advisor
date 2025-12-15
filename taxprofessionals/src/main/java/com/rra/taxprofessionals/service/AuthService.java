package com.rra.taxprofessionals.service;

import com.rra.taxprofessionals.dto.*;

public interface AuthService {

    ApiResponse<LoginResponse> login(LoginRequest loginRequest);
}
