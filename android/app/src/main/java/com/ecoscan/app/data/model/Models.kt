package com.ecoscan.app.data.model

import com.google.gson.annotations.SerializedName

enum class UserRole {
    RESIDENT, COLLECTOR, ADMIN
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val phone: String = "",
    val houseId: String? = null,
    val status: String = "ACTIVE"
)

data class WasteDetectionItem(
    val objectName: String,
    val category: String,
    val wasteType: String, // "Dry Waste" or "Wet Waste"
    val confidence: Float,
    val recyclable: Boolean,
    val recommendedBin: String,
    val disposalMethod: String
)

data class WasteDetectionResponse(
    val success: Boolean,
    val garbageDetected: Boolean,
    val humanDetected: Boolean,
    val nonWasteDetected: Boolean,
    val detections: List<WasteDetectionItem> = emptyList(),
    val message: String
)

data class ScanRecord(
    val id: String,
    val residentId: String,
    val houseId: String,
    val detectedObject: String,
    val category: String,
    val wasteType: String,
    val confidence: Float,
    val recyclable: Boolean,
    val recommendedBin: String,
    val disposalMethod: String,
    val date: String,
    val time: String,
    val status: String = "PENDING_COLLECTION"
)

data class AssignedHouse(
    val houseId: String,
    val residentName: String,
    val address: String,
    val phone: String,
    val latitude: Double,
    val longitude: Double,
    var status: String = "PENDING",
    val distance: String = "0.4 km"
)

data class GarbageReport(
    val id: String,
    val title: String,
    val description: String,
    val location: String,
    val latitude: Double,
    val longitude: Double,
    val status: String = "PENDING",
    val date: String = "Today"
)
