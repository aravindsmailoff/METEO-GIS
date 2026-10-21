import React, { useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { GeoPoint, ReportDraft, ReportKind } from "@/lib/flood/types";
import { copy } from "@/lib/i18n/copy";
import { useFlood } from "@/lib/flood/FloodProvider";
import { ActionButton, C } from "./ui";

const TYPES: { id: ReportKind; icon: keyof typeof Ionicons.glyphMap; labelKey: "typeFlood" | "typeStuck" | "typeMedical" | "typeInfrastructure" }[] = [
  { id: "flood", icon: "water", labelKey: "typeFlood" },
  { id: "stuck", icon: "warning", labelKey: "typeStuck" },
  { id: "medical", icon: "medkit", labelKey: "typeMedical" },
  { id: "infrastructure", icon: "construct", labelKey: "typeInfrastructure" },
];

type Props = {
  visible: boolean;
  location: GeoPoint;
  initialDraft?: ReportDraft;
  onClose: () => void;
  onPickLocation: (draft: ReportDraft) => void;
  onSave: (report: { kind: ReportKind; description: string; photoUri?: string; latitude: number; longitude: number }) => void;
};

export function ReportComposer({ visible, location, initialDraft, onClose, onPickLocation, onSave }: Props) {
  const { language } = useFlood();
  const [kind, setKind] = useState<ReportKind>(initialDraft?.kind ?? "flood");
  const [description, setDescription] = useState(initialDraft?.description ?? "");
  const [photoUri, setPhotoUri] = useState<string | undefined>(initialDraft?.photoUri);
  const [showValidation, setShowValidation] = useState(false);
  const t = (key: Parameters<typeof copy>[1]) => copy(language, key);

  const dismiss = () => {
    setShowValidation(false);
    onClose();
  };

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.55,
      exif: false,
    });
    if (!result.canceled && result.assets[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const submit = () => {
    if (description.trim().length < 6) {
      setShowValidation(true);
      return;
    }
    onSave({ kind, description: description.trim(), photoUri, ...location });
    setDescription("");
    setPhotoUri(undefined);
    setKind(initialDraft?.kind ?? "flood");
    setShowValidation(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={dismiss}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("reportTitle")}</Text>
              <Text style={styles.subtitle}>{t("reportSubtitle")}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t("close")} onPress={dismiss} style={styles.close}>
              <Ionicons name="close" size={20} color={C.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.warning}>
              <Ionicons name="alert-circle" size={18} color={C.coral} />
              <Text style={styles.warningText}>{t("reportWarning")}</Text>
            </View>

            <Text style={styles.label}>{t("reportType")}</Text>
            <View style={styles.types}>
              {TYPES.map((item) => {
                const selected = kind === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setKind(item.id)}
                    style={({ pressed }) => [styles.type, selected && styles.typeSelected, pressed && styles.typePressed]}
                  >
                    <Ionicons name={item.icon} size={16} color={selected ? C.white : C.muted} />
                    <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{t(item.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>{t("location")}</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color={C.blue} />
                <Text style={styles.locationText}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => onPickLocation({ kind, description, photoUri })} style={styles.pinButton}>
                <Text style={styles.pinButtonText}>{t("pickOnMap")}</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>{t("description")}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("description")}
              placeholderTextColor={C.dim}
              multiline
              maxLength={280}
              textAlignVertical="top"
              accessibilityLabel={t("description")}
              style={styles.input}
            />
            {showValidation ? <Text style={styles.error}>Please add at least 6 characters.</Text> : null}

            <View style={styles.photoRow}>
              <ActionButton
                icon="image-outline"
                label={photoUri ? t("removePhoto") : t("addPhoto")}
                variant="secondary"
                onPress={photoUri ? () => setPhotoUri(undefined) : choosePhoto}
                style={{ flex: 1 }}
              />
              {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}
            </View>

            <View style={styles.localOnly}>
              <Ionicons name="phone-portrait-outline" size={15} color={C.dim} />
              <Text style={styles.localOnlyText}>{t("localOnly")}</Text>
            </View>

            <ActionButton icon="save" label={t("saveReport")} onPress={submit} style={{ marginTop: 4 }} />
            <Pressable accessibilityRole="button" onPress={dismiss} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </Pressable>
            {Platform.OS === "web" ? <Text style={styles.webHint}>Photos are selected from this browser/device only.</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.16)",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 12,
  },
  title: {
    color: C.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    maxWidth: 290,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    gap: 12,
    paddingBottom: 10,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 69, 58, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.25)",
  },
  warningText: {
    flex: 1,
    color: C.coral,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  label: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  types: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  type: {
    minHeight: 42,
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  typeSelected: {
    borderColor: C.blue,
    backgroundColor: C.blue,
  },
  typePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  typeText: {
    color: C.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  typeTextSelected: {
    color: C.white,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
  },
  pinButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(10, 132, 255, 0.18)",
    borderRadius: 10,
  },
  pinButtonText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 90,
    borderRadius: 14,
    padding: 12,
    color: C.text,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    fontSize: 14,
  },
  error: {
    color: C.coral,
    fontSize: 12,
    marginTop: -6,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  localOnly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  localOnlyText: {
    color: C.dim,
    fontSize: 12,
    flex: 1,
  },
  cancelButton: {
    alignSelf: "center",
    padding: 10,
  },
  cancelText: {
    color: C.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  webHint: {
    color: C.dim,
    textAlign: "center",
    fontSize: 11,
  },
});
