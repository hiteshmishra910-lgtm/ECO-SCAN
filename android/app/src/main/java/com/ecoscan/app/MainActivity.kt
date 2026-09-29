package com.ecoscan.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.ecoscan.app.ui.screens.EcoScanApp
import com.ecoscan.app.ui.theme.EcoScanTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EcoScanTheme {
                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    EcoScanApp()
                }
            }
        }
    }
}
