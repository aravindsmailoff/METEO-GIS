"""
NER Landslide RiskWatch — Multi-tier Alert Broadcast Engine (CAP 1.2, SMS & Siren)
Generates OASIS Common Alerting Protocol compliant XML/JSON feeds and simulates emergency dispatches
"""

import uuid
import datetime
from typing import Dict, Any, List

def generate_cap_alert(
    headline: str,
    description: str,
    severity: str,
    urgency: str,
    certainty: str,
    districts: List[str],
    instruction: str,
    channels: List[str]
) -> Dict[str, Any]:
    alert_id = f"NER-CAP-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Generate OASIS CAP 1.2 XML compliant structure
    cap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{alert_id}</identifier>
  <sender>ner-early-warning@ndma.gov.in</sender>
  <sent>{timestamp}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Geo</category>
    <event>Landslide & Slope Failure Warning</event>
    <urgency>{urgency}</urgency>
    <severity>{severity}</severity>
    <certainty>{certainty}</certainty>
    <eventCode>
      <valueName>SAME</valueName>
      <value>LSW</value>
    </eventCode>
    <headline>{headline}</headline>
    <description>{description}</description>
    <instruction>{instruction}</instruction>
    <area>
      <areaDesc>{', '.join(districts)}</areaDesc>
    </area>
  </info>
</alert>"""

    return {
        "alert_id": alert_id,
        "timestamp": timestamp,
        "headline": headline,
        "description": description,
        "severity": severity,
        "urgency": urgency,
        "certainty": certainty,
        "districts": districts,
        "instruction": instruction,
        "channels_dispatched": channels,
        "cap_xml": cap_xml,
        "sms_broadcast_count": len(districts) * 4520, # Estimated citizen subscriber reach
        "sirens_activated": 8 if severity in ["Extreme", "Severe", "Critical"] else 2,
        "status": "DISPATCHED_SUCCESSFULLY"
    }
