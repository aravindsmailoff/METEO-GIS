import type { SevereWeatherAlert } from "../flood/types";

export const OFFICIAL_PRECAUTIONS: Record<SevereWeatherAlert["category"], string[]> = {
  THUNDERSTORM: [
    "Seek shelter inside a sturdy building immediately.",
    "Unplug sensitive electronic devices and avoid corded phones.",
    "Stay away from open fields, hilltops, and isolated tall trees.",
    "If caught in the open, crouch low on the balls of your feet.",
  ],
  HAILSTORM: [
    "Stay completely indoors away from skylights and glass windows.",
    "Keep pets and livestock under reinforced covered shelters.",
    "Safely pull vehicles under bridges or carports to prevent windshield damage.",
  ],
  CLOUDBURST: [
    "Evacuate immediately to higher ground away from stream beds and riverbanks.",
    "Never attempt to walk or drive through flowing flash-flood waters.",
    "Avoid bridges over fast-moving stormwater tributaries.",
  ],
  VERY_HEAVY_RAIN: [
    "Avoid transit through known urban pluvial waterlogging bottlenecks.",
    "Keep emergency battery torches, potable water, and medical kits ready.",
    "Check official district municipal drains and pumping bulletins.",
  ],
  LIGHTNING: [
    "Follow the 30/30 rule: If thunder is heard within 30s of lightning, stay indoors.",
    "Avoid metal fences, railway tracks, and open golf/sports fields.",
  ],
  HIGH_WIND: [
    "Secure loose outdoor furniture, tin roofs, and construction signboards.",
    "Avoid parking under decayed trees or aging utility power lines.",
  ],
  LANDSLIDE: [
    "Stay vigilant on hill cut roads for rolling debris or sudden soil movement.",
    "Listen for unusual sounds like trees cracking or boulders knocking.",
    "Evacuate vulnerable slope corridors during prolonged downpours.",
  ],
};
