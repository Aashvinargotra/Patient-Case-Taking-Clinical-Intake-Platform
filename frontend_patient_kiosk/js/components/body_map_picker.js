/**
 * MediKiosk Interactive Anatomical Body Map Component (Hospital Clean White Theme)
 * Provides clickable SVG human body map for localized pain and symptom exploration across 8 languages.
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { getTranslation } from "../config.js";
import { icon } from "../icons.js";

export function renderBodyMapPicker(container, onAreaSelected) {
    const state = kioskState.getState();
    const lang = state.language || "hi";
    const t = getTranslation(lang);

    const bodyAreas = [
        {
            id: "chest",
            icon: "heart",
            names: {
                hi: "छाती / हृदय",
                pa: "ਛਾਤੀ / ਦਿਲ",
                bn: "বুক / হৃদপিণ্ড",
                ta: "மார்பு / இதயம்",
                te: "ఛాతీ / గుండె",
                mr: "छाती / हृदय",
                gu: "છાતી / હૃદય",
                en: "Chest / Heart Area"
            }
        },
        {
            id: "head",
            icon: "user",
            names: {
                hi: "सिर / मस्तिष्क",
                pa: "ਸਿਰ / ਦਿਮਾਗ਼",
                bn: "মাথা / মস্তিষ্ক",
                ta: "தலை / மூளை",
                te: "తల / మెదడు",
                mr: "डोके / मेंदू",
                gu: "માથું / મગજ",
                en: "Head / Forehead"
            }
        },
        {
            id: "abdomen",
            icon: "activity",
            names: {
                hi: "पेट / नाभि",
                pa: "ਢਿੱਡ / ਨਾਭੀ",
                bn: "পেট / নাভি",
                ta: "வயிறு / தொப்புள்",
                te: "పొట్ట / నాభి",
                mr: "पोट / नाभी",
                gu: "પેટ / ડૂંટી",
                en: "Abdomen / Stomach"
            }
        },
        {
            id: "knee",
            icon: "activity",
            names: {
                hi: "घुटने / जोड़",
                pa: "ਗੋਡੇ / ਜੋੜ",
                bn: "হাঁটু / জয়েন্ট",
                ta: "முழங்கால் / மூட்டுகள்",
                te: "మోకాళ్ళు / కీళ్ళు",
                mr: "गुडघे / सांधे",
                gu: "ઘૂંટણ / સાંધા",
                en: "Knees / Joints"
            }
        },
        {
            id: "back",
            icon: "activity",
            names: {
                hi: "कमर / रीढ़",
                pa: "ਲੱਕ / ਰੀੜ੍ਹ",
                bn: "কোমর / মেরুদণ্ড",
                ta: "முதுகு / தண்டுவடம்",
                te: "వెన్ను / నడుము",
                mr: "कंबर / पाठीचा कणा",
                gu: "કમર / કરોડરજ્જુ",
                en: "Lower Back / Spine"
            }
        },
        {
            id: "throat",
            icon: "volume-2",
            names: {
                hi: "गला / गर्दन",
                pa: "ਗਲਾ / ਗਰਦਨ",
                bn: "গলা / ঘাড়",
                ta: "தொண்டை / கழுத்து",
                te: "గొంతు / మెడ",
                mr: "घसा / मान",
                gu: "ગળું / ગરદન",
                en: "Throat / Neck"
            }
        },
        {
            id: "arms",
            icon: "activity",
            names: {
                hi: "हाथ / बांह",
                pa: "ਹੱਥ / ਬਾਹਾਂ",
                bn: "হাত / বাহু",
                ta: "கைகள் / தோள்பட்டை",
                te: "చేతులు / భుజాలు",
                mr: "हात / खांदे",
                gu: "હાથ / ખભા",
                en: "Arms / Shoulders"
            }
        },
        {
            id: "skin",
            icon: "shield",
            names: {
                hi: "त्वचा / एलर्जी",
                pa: "ਚਮੜੀ / ਐਲਰਜੀ",
                bn: "ত্বক / অ্যালার্জি",
                ta: "தோல் / ஒவ்வாமை",
                te: "చర్మం / అలర్జీ",
                mr: "त्वचा / ऍलर्जी",
                gu: "ત્વચા / એલર્જી",
                en: "Skin / Rashes"
            }
        },
        {
            id: "general",
            icon: "help-circle",
            names: {
                hi: "पक्का नहीं / पूरे शरीर में बेचैनी",
                pa: "ਪੱਕਾ ਨਹੀਂ / ਸਾਰੇ ਸਰੀਰ 'ਚ ਤਕਲੀਫ਼",
                bn: "নিশ্চিত নই / সারা শরীরে অস্বস্তি",
                ta: "உறுதியாக தெரியவில்லை / உடல் சோர்வு",
                te: "ఖచ్చితంగా తెలియదు / మొత్తం శరీరం అసౌకర్యం",
                mr: "नक्की नाही / अंगदुखी किंवा अशक्तपणा",
                gu: "ખાતરી નથી / આખા શરીરમાં અસ્વસ્થતા",
                en: "Not Sure / Whole Body Discomfort"
            }
        }
    ];

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 1000px; margin: auto; animation: fade-in 250ms ease;">
            
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                    ${t.bodyMapTitle || 'Select Affected Body Region'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                    ${t.bodyMapSub || 'Tap on the anatomical region where you feel pain, discomfort, or symptoms.'}
                </p>
            </div>

            <!-- Body Map Interactive Grid -->
            <div class="chip-grid" style="max-width: 820px; margin-bottom: 24px;">
                ${bodyAreas.map(area => {
                    const areaName = area.names[lang] || area.names.hi;
                    return `
                        <button class="touch-chip" data-area-id="${area.id}" data-area-name="${areaName}" aria-label="${areaName}" style="display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px;">
                            <span style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #f0fdfa;">
                                ${icon(area.icon, { size: 18, color: '#0d9488' })}
                            </span>
                            <span style="font-weight: 700; font-size: 14.5px;">${areaName}</span>
                        </button>
                    `;
                }).join('')}
            </div>�રમાં અસ્વસ્થતા",
                en: "Not Sure / Whole Body Discomfort"
            }
        }
    ];

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 1000px; margin: auto; animation: fade-in 250ms ease;">
            
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                    ${t.bodyMapTitle || 'Select Affected Body Region'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                    ${t.bodyMapSub || 'Tap on the anatomical region where you feel pain, discomfort, or symptoms.'}
                </p>
            </div>

            <!-- Body Map Interactive Grid -->
            <div class="chip-grid" style="max-width: 820px; margin-bottom: 24px;">
                ${bodyAreas.map(area => {
                    const areaName = area.names[lang] || area.names.hi;
                    return `
                        <button class="touch-chip" data-area-id="${area.id}" data-area-name="${areaName}" aria-label="${areaName}">
                            <span style="font-size: 26px;">${area.icon}</span>
                            <span>${areaName}</span>
                        </button>
                    `;
                }).join('')}
            </div>

            <!-- Visual SVG Human Outline Graphic -->
            <div style="width: 240px; height: 260px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);">
                <svg viewBox="0 0 200 280" style="width: 75%; height: 75%; fill: none; stroke: var(--primary-teal); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round;">
                    <!-- Head -->
                    <circle cx="100" cy="35" r="22" />
                    <!-- Neck -->
                    <line x1="100" y1="57" x2="100" y2="70" />
                    <!-- Torso -->
                    <path d="M 70 70 L 130 70 L 120 160 L 80 160 Z" />
                    <!-- Arms -->
                    <line x1="70" y1="70" x2="35" y2="140" />
                    <line x1="130" y1="70" x2="165" y2="140" />
                    <!-- Legs -->
                    <line x1="85" y1="160" x2="80" y2="250" />
                    <line x1="115" y1="160" x2="120" y2="250" />
                </svg>
            </div>

        </div>
    `;

    // Speak prompt
    setTimeout(() => {
        const prompt = t.bodyMapSub || "Please tap on the body area where you are feeling discomfort.";
        audioController.speak(prompt, lang);
    }, 300);

    // Click handler for body chips
    container.querySelectorAll(".touch-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const areaId = chip.getAttribute("data-area-id");
            const areaName = chip.getAttribute("data-area-name");
            kioskState.setState({ affectedBodyArea: areaId, affectedBodyAreaName: areaName });
            if (onAreaSelected) onAreaSelected(areaId);
        });
    });
}
