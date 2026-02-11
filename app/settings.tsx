import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "../src/context/SettingsContext";
import DrinkStepper from "../src/components/DrinkStepper";
import ActionButton from "../src/components/ActionButton";
import { Colors } from "../constants/Colors";
import { useResponsive } from "../src/hooks/useResponsive";
import { GameSettings } from "../src/types";

const ROUND_LABELS = ["Round 1 - Smoke or Fire", "Round 2 - Higher or Lower", "Round 3 - Inside or Outside", "Round 4 - Guess the Suit"];
const PYRAMID_LABELS = ["Row 1 - Give", "Row 2 - Take", "Row 3 - Give", "Row 4 - Take", "Row 5 - Give"];

export default function Settings() {
  const { settings, updateSettings, resetToDefaults } = useSettings();
  const { fs, sh, sw } = useResponsive();

  const handleRoundDrinkChange = (index: number, value: number) => {
    const newRoundDrinks = [...settings.roundDrinks] as GameSettings["roundDrinks"];
    newRoundDrinks[index] = value;
    updateSettings({ roundDrinks: newRoundDrinks });
  };

  const handlePyramidDrinkChange = (index: number, value: number) => {
    const newPyramidDrinks = [...settings.pyramidDrinks] as GameSettings["pyramidDrinks"];
    newPyramidDrinks[index] = value;
    updateSettings({ pyramidDrinks: newPyramidDrinks });
  };

  const handleBack = () => {
    router.replace("/");
  };

  return (
    <LinearGradient
      colors={[Colors.background, "#1A0A0A"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingHorizontal: sw(24) }]}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: sh(24) }]}>
            <Text style={[styles.title, { fontSize: fs(32) }]}>Settings</Text>
            <Text style={[styles.subtitle, { fontSize: fs(14) }]}>
              Configure drink amounts for each round
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Round Drinks Section */}
            <View style={[styles.section, { marginBottom: sh(24) }]}>
              <Text style={[styles.sectionTitle, { fontSize: fs(14), marginBottom: sh(12) }]}>
                Round Drinks
              </Text>
              {ROUND_LABELS.map((label, index) => (
                <DrinkStepper
                  key={index}
                  label={label}
                  value={settings.roundDrinks[index]}
                  onChange={(value) => handleRoundDrinkChange(index, value)}
                />
              ))}
            </View>

            {/* Pyramid Drinks Section */}
            <View style={[styles.section, { marginBottom: sh(24) }]}>
              <Text style={[styles.sectionTitle, { fontSize: fs(14), marginBottom: sh(12) }]}>
                Pyramid Drinks
              </Text>
              {PYRAMID_LABELS.map((label, index) => (
                <DrinkStepper
                  key={index}
                  label={label}
                  value={settings.pyramidDrinks[index]}
                  onChange={(value) => handlePyramidDrinkChange(index, value)}
                />
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingVertical: sh(20) }]}>
            <ActionButton
              title="Reset to Defaults"
              variant="ghost"
              onPress={resetToDefaults}
              style={{ marginBottom: sh(12) }}
            />
            <ActionButton
              title="Back"
              onPress={handleBack}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {},
  sectionTitle: {
    color: Colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  footer: {
    alignItems: "center",
  },
});
