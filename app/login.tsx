import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";

const LS_KEYS = {
  isLoggedIn: "nb_is_logged_in",
  userEmail: "nb_user_email",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    // Validate inputs
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!loginCode.trim()) {
      setError("Please enter your login code.");
      return;
    }

    // Validate login code
    if (loginCode.toUpperCase() !== "MENLO") {
      setError("Incorrect login code. Use MENLO.");
      return;
    }

    setIsLoading(true);

    try {
      // Store login state
      await AsyncStorage.setItem(LS_KEYS.isLoggedIn, "true");
      await AsyncStorage.setItem(LS_KEYS.userEmail, email.trim());

      // Navigate to team selection
      router.replace("/team-select" as any);
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F7FAFF]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo / Header */}
          <View className="items-center mb-10">
            <Text className="text-3xl font-bold text-[#0A1F44] mb-2">MENLO NETBALL</Text>
            <Text className="text-[#475569] text-base">Coach Planning App</Text>
          </View>

          {/* Login Form */}
          <View className="bg-white rounded-2xl p-6 border border-[#D9E2F1] shadow-sm">
            <Text className="text-xl font-semibold text-[#111827] mb-6">Login</Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-[#475569] mb-2">Email / Username</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-[#111827] text-base"
                style={{ height: 48 }}
              />
            </View>

            {/* Login Code Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-[#475569] mb-2">Login Code</Text>
              <TextInput
                value={loginCode}
                onChangeText={setLoginCode}
                placeholder="Enter login code"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
                autoCorrect={false}
                className="bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-[#111827] text-base"
                style={{ height: 48 }}
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-xl py-3 items-center ${
                isLoading ? "bg-[#A7F3D0]" : "bg-[#22C55E]"
              }`}
              style={{ height: 48 }}
            >
              <Text className="text-white font-bold text-base">
                {isLoading ? "Logging in..." : "LOGIN"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="items-center mt-8">
            <Text className="text-[#64748B] text-sm italic">"Streef die hoogtes na"</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
