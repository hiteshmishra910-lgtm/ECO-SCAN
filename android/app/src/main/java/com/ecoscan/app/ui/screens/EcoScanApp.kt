package com.ecoscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ecoscan.app.data.model.*
import com.ecoscan.app.ui.theme.*

@Composable
fun EcoScanApp() {
    var currentUser by remember {
        mutableStateOf<User?>(
            User(
                id = "USR-RES-001",
                name = "Priya Sharma",
                email = "priya@ecoscan.app",
                role = UserRole.RESIDENT,
                houseId = "H-101"
            )
        )
    }

    if (currentUser == null) {
        AuthScreen(onLogin = { role ->
            currentUser = when (role) {
                UserRole.RESIDENT -> User("USR-RES-001", "Priya Sharma", "priya@ecoscan.app", UserRole.RESIDENT, houseId = "H-101")
                UserRole.COLLECTOR -> User("USR-COL-001", "Rajesh Kumar", "rajesh@ecoscan.app", UserRole.COLLECTOR)
                UserRole.ADMIN -> User("USR-ADM-001", "EcoScan Director", "admin@ecoscan.app", UserRole.ADMIN)
            }
        })
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(EcoBg)
        ) {
            // App Top Header
            AppHeader(
                user = currentUser!!,
                onSwitchRole = { newRole ->
                    currentUser = when (newRole) {
                        UserRole.RESIDENT -> User("USR-RES-001", "Priya Sharma", "priya@ecoscan.app", UserRole.RESIDENT, houseId = "H-101")
                        UserRole.COLLECTOR -> User("USR-COL-001", "Rajesh Kumar", "rajesh@ecoscan.app", UserRole.COLLECTOR)
                        UserRole.ADMIN -> User("USR-ADM-001", "EcoScan Director", "admin@ecoscan.app", UserRole.ADMIN)
                    }
                },
                onLogout = { currentUser = null }
            )

            // Role Dashboard
            when (currentUser!!.role) {
                UserRole.RESIDENT -> ResidentDashboard()
                UserRole.COLLECTOR -> CollectorDashboard()
                UserRole.ADMIN -> AdminDashboard()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppHeader(user: User, onSwitchRole: (UserRole) -> Unit, onLogout: () -> Unit) {
    TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Recycling, contentDescription = null, tint = EcoPrimary)
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text("ECOSCAN", fontWeight = FontWeight.Black, fontSize = 16.sp, color = EcoDark)
                    Text("Role: ${user.role.name}", fontSize = 11.sp, color = TextSecondary)
                }
            }
        },
        actions = {
            AssistChip(
                onClick = {
                    val nextRole = when (user.role) {
                        UserRole.RESIDENT -> UserRole.COLLECTOR
                        UserRole.COLLECTOR -> UserRole.ADMIN
                        UserRole.ADMIN -> UserRole.RESIDENT
                    }
                    onSwitchRole(nextRole)
                },
                label = { Text("Switch Role", fontSize = 10.sp) }
            )
            IconButton(onClick = onLogout) {
                Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = Color.Gray)
            }
        }
    )
}

@Composable
fun AuthScreen(onLogin: (UserRole) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EcoBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(EcoLight),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Recycling, contentDescription = null, tint = EcoDark, modifier = Modifier.size(40.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("ECOSCAN", fontSize = 28.sp, fontWeight = FontWeight.Black, color = EcoDark)
        Text("Smart Waste Management Platform", fontSize = 13.sp, color = TextSecondary)

        Spacer(modifier = Modifier.height(32.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Select Demo Login Role:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { onLogin(UserRole.RESIDENT) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = EcoPrimary)
                ) {
                    Icon(Icons.Default.Home, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sign in as Resident")
                }

                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { onLogin(UserRole.COLLECTOR) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = EcoDark)
                ) {
                    Icon(Icons.Default.LocalShipping, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sign in as Waste Collector")
                }

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { onLogin(UserRole.ADMIN) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.AdminPanelSettings, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sign in as Administrator")
                }
            }
        }
    }
}

@Composable
fun ResidentDashboard() {
    var showScanner by remember { mutableStateOf(false) }
    var scanResult by remember { mutableStateOf<WasteDetectionResponse?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = EcoDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Today's Household Segregation", color = EcoLight, fontSize = 12.sp)
                    Text("House #101 • Green Valley", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Dry Waste", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                            Text("1.8 kg", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        }
                        Column {
                            Text("Wet Waste", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                            Text("2.4 kg", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        }
                        Column {
                            Text("Pickup", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                            Text("Scheduled", color = EcoLight, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }
        }

        item {
            Button(
                onClick = { showScanner = !showScanner },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = EcoPrimary),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.CameraAlt, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (showScanner) "Close Camera Scanner" else "SCAN HOUSEHOLD WASTE")
            }
        }

        if (showScanner) {
            item {
                NativeCameraScannerCard(
                    onScanComplete = { result -> scanResult = result }
                )
            }
        }

        if (scanResult != null) {
            item {
                ScanResultCard(result = scanResult!!)
            }
        }

        item {
            Text("Collection History", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = EcoDark)
        }

        items(
            listOf(
                Triple("Plastic Bottle", "Dry Waste", "08:45 AM • Verified"),
                Triple("Vegetable Peels", "Wet Waste", "Yesterday • Collected"),
                Triple("Cardboard Box", "Dry Waste", "27 Sep • Recycled")
            )
        ) { (item, type, time) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (type == "Dry Waste") Icons.Default.DeleteOutline else Icons.Default.Eco,
                        contentDescription = null,
                        tint = if (type == "Dry Waste") DryBlue else WetGreen
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(item, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(time, fontSize = 11.sp, color = TextSecondary)
                    }
                    Surface(
                        color = if (type == "Dry Waste") Color(0xFFEFF6FF) else Color(0xFFF0FDF4),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            type,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (type == "Dry Waste") DryBlue else WetGreen,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NativeCameraScannerCard(onScanComplete: (WasteDetectionResponse) -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.Black),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color(0xFF1E293B), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Camera, contentDescription = null, tint = EcoPrimary, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("CameraX Real-Time Viewfinder", color = Color.White, fontWeight = FontWeight.Bold)
                    Text("Point camera at waste item", color = Color.Gray, fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        // Simulate Bottle Detection
                        onScanComplete(
                            WasteDetectionResponse(
                                success = true,
                                garbageDetected = true,
                                humanDetected = false,
                                nonWasteDetected = false,
                                detections = listOf(
                                    WasteDetectionItem(
                                        objectName = "Plastic Bottle",
                                        category = "Plastic",
                                        wasteType = "Dry Waste",
                                        confidence = 0.94f,
                                        recyclable = true,
                                        recommendedBin = "Dry Waste Bin (Blue)",
                                        disposalMethod = "Rinse bottle, crush to reduce volume, place in blue dry recyclables bin."
                                    )
                                ),
                                message = "Waste detected successfully."
                            )
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EcoPrimary)
                ) {
                    Text("Capture Waste Item")
                }

                OutlinedButton(
                    onClick = {
                        // Simulate Human / Non-waste warning
                        onScanComplete(
                            WasteDetectionResponse(
                                success = true,
                                garbageDetected = false,
                                humanDetected = true,
                                nonWasteDetected = true,
                                detections = emptyList(),
                                message = "Human/person detected. Please scan actual waste."
                            )
                        )
                    }
                ) {
                    Text("Scan Person (Test Warning)")
                }
            }
        }
    }
}

@Composable
fun ScanResultCard(result: WasteDetectionResponse) {
    if (!result.garbageDetected) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
            shape = RoundedCornerShape(14.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = WarnAmber)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("NO GARBAGE DETECTED", fontWeight = FontWeight.Black, color = Color(0xFF92400E))
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(result.message, fontSize = 13.sp, color = Color(0xFF78350F))
            }
        }
    } else {
        val item = result.detections.firstOrNull() ?: return
        Card(
            colors = CardDefaults.cardColors(containerColor = EcoCardAlt),
            shape = RoundedCornerShape(14.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(item.objectName, fontWeight = FontWeight.Black, fontSize = 18.sp, color = EcoDark)
                    Surface(
                        color = if (item.wasteType == "Dry Waste") DryBlue else WetGreen,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            item.wasteType,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text("Category: ${item.category} • ${(item.confidence * 100).toInt()}% confidence", fontSize = 12.sp, color = TextSecondary)
                Text("Recommended Bin: ${item.recommendedBin}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextPrimary)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Disposal: ${item.disposalMethod}", fontSize = 12.sp, color = TextSecondary)
            }
        }
    }
}

@Composable
fun CollectorDashboard() {
    var onDuty by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = if (onDuty) EcoDark else Color.DarkGray),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Collector Duty Status", color = EcoLight, fontSize = 12.sp)
                            Text(if (onDuty) "ON DUTY (Active GPS)" else "OFF DUTY", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        }
                        Switch(
                            checked = onDuty,
                            onCheckedChange = { onDuty = it }
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Vehicle: MH-31-EQ-4421 • Waste Truck 500kg", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                }
            }
        }

        item {
            Text("Today's Assigned Route", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = EcoDark)
        }

        items(
            listOf(
                AssignedHouse("H-101", "Priya Sharma", "42 Green Valley Apt", "+91 98231 44102", 21.1458, 79.0882, "PENDING", "0.3 km"),
                AssignedHouse("H-102", "Amit Verma", "12 Sunrise Colony", "+91 98220 55192", 21.1472, 79.0895, "COMPLETED", "0.8 km"),
                AssignedHouse("H-103", "Kavita Rao", "7 Palm Grove Estate", "+91 98211 66321", 21.1491, 79.0910, "PENDING", "1.2 km")
            )
        ) { house ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("${house.houseId} • ${house.residentName}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(house.distance, fontSize = 11.sp, color = EcoPrimary, fontWeight = FontWeight.Bold)
                    }
                    Text(house.address, fontSize = 12.sp, color = TextSecondary)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Status: ${house.status}", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        Button(
                            onClick = { /* Mark collected */ },
                            colors = ButtonDefaults.buttonColors(containerColor = if (house.status == "COMPLETED") Color.Gray else EcoPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(if (house.status == "COMPLETED") "Done" else "Collect Waste", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AdminDashboard() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Admin Monitoring & KPI Analytics", fontWeight = FontWeight.Black, fontSize = 20.sp, color = EcoDark)
            Text("Real-time city waste monitoring overview", fontSize = 12.sp, color = TextSecondary)
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MetricCard("142", "Residents", EcoPrimary, Modifier.weight(1f))
                MetricCard("8", "Collectors", EcoDark, Modifier.weight(1f))
                MetricCard("860 kg", "Collected", DryBlue, Modifier.weight(1f))
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Segregation Efficiency", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    LinearProgressIndicator(
                        progress = { 0.78f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(RoundedCornerShape(5.dp)),
                        color = EcoPrimary,
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Dry Waste Recycled: 58%", fontSize = 11.sp, color = DryBlue, fontWeight = FontWeight.Bold)
                        Text("Wet Compost: 42%", fontSize = 11.sp, color = WetGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        item {
            Text("Live Fleet Tracking", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = EcoDark)
        }

        items(
            listOf(
                Pair("Rajesh Kumar (Truck 1)", "GPS: 21.1465, 79.0875 • Zone North • 5 pickups left"),
                Pair("Deepak Sharma (Truck 2)", "GPS: 21.1510, 79.0935 • Zone Central • 2 pickups left")
            )
        ) { (collector, detail) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Navigation, contentDescription = null, tint = EcoPrimary)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(collector, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(detail, fontSize = 11.sp, color = TextSecondary)
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.Black, fontSize = 18.sp, color = color)
            Text(label, fontSize = 11.sp, color = TextSecondary)
        }
    }
}
