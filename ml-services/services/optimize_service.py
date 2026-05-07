def optimize_charging(payload):
    peak_load = payload["peakLoadMW"]
    base_load = payload.get("baseLoadMW", peak_load * 0.7)
    sessions = payload.get("activeSessions", 320)
    evening_peak = payload.get("eveningPeak", True)

    if evening_peak:
        shift_window = "23:00-03:00"
        reduction = min(32.0, 12.0 + (peak_load - base_load) * 3.2)
    else:
        shift_window = "22:00-02:00"
        reduction = min(24.0, 10.0 + (peak_load - base_load) * 2.5)

    sessions_shifted = int(round(sessions * (reduction / 100.0)))

    return {
        "shiftWindow": shift_window,
        "peakReductionPercent": round(reduction, 1),
        "sessionsShifted": sessions_shifted,
    }
