package com.ecoscan.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = EcoPrimary,
    onPrimary = Color.White,
    primaryContainer = EcoLight,
    onPrimaryContainer = EcoDark,
    background = EcoBg,
    surface = Color.White,
    onSurface = TextPrimary
)

@Composable
fun EcoScanTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
