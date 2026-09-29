package com.ecoscan.app.data.api

import com.ecoscan.app.data.model.WasteDetectionResponse
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import java.util.concurrent.TimeUnit

interface EcoScanApi {
    @Multipart
    @POST("api/detect-waste")
    suspend fun detectWaste(
        @Part image: MultipartBody.Part
    ): WasteDetectionResponse

    companion object {
        // Point to your deployed server or local Android emulator alias (10.0.2.2:3000)
        private const val BASE_URL = "https://ais-dev-4am7r3khyw6jgxoprg4fo6-505967678927.asia-southeast1.run.app/"

        fun create(): EcoScanApi {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(EcoScanApi::class.java)
        }
    }
}
