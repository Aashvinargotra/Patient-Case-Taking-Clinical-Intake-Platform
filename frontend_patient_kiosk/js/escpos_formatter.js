/**
 * MediKiosk ESC/POS Thermal Printer Protocol Formatter (Phase 3.6)
 * Generates raw ESC/POS binary command arrays for direct 58mm / 80mm USB & network thermal slip printers.
 */

export class EscPosFormatter {
    constructor() {
        this.buffer = [];
    }

    // Initialize printer
    init() {
        this.buffer.push(0x1B, 0x40); // ESC @
        return this;
    }

    // Alignment: 'left' (0), 'center' (1), 'right' (2)
    align(alignment = 'center') {
        const alignMap = { left: 0, center: 1, right: 2 };
        this.buffer.push(0x1B, 0x61, alignMap[alignment] || 0); // ESC a n
        return this;
    }

    // Text size scaling: double height and double width
    setSize(doubleWidth = false, doubleHeight = false) {
        let n = 0;
        if (doubleWidth) n |= 0x20;
        if (doubleHeight) n |= 0x01;
        this.buffer.push(0x1D, 0x21, n); // GS ! n
        return this;
    }

    // Bold text toggle
    bold(enable = true) {
        this.buffer.push(0x1B, 0x45, enable ? 1 : 0); // ESC E n
        return this;
    }

    // Add plaintext string
    text(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str + "\n");
        bytes.forEach(b => this.buffer.push(b));
        return this;
    }

    // Dashed divider line
    divider(char = '-', width = 32) {
        this.text(char.repeat(width));
        return this;
    }

    // Line feeds
    feed(lines = 1) {
        this.buffer.push(0x1B, 0x64, lines); // ESC d n
        return this;
    }

    // Cut paper (Partial cut with feed)
    cut() {
        this.buffer.push(0x1D, 0x56, 0x42, 0x00); // GS V 'B' 0
        return this;
    }

    // Returns Uint8Array ready for WebUSB / Raw Socket transmission
    getBytes() {
        return new Uint8Array(this.buffer);
    }
}

/**
 * Builds standard MediKiosk 80mm/58mm thermal slip ticket payload
 */
export function buildThermalSlipEscPos(tokenData) {
    const formatter = new EscPosFormatter();
    const tokenNum = tokenData.token_number || 108;
    const dept = tokenData.department || "General Medicine OPD";
    const room = tokenData.room || "Room 101";

    formatter.init()
        .align('center')
        .bold(true)
        .text("ALL INDIA INSTITUTE OF AYURVEDA")
        .bold(false)
        .text("OPD CLINICAL INTAKE TOKEN SLIP")
        .divider('=', 32)
        .feed(1)
        .text("YOUR TOKEN NUMBER")
        .setSize(true, true) // Large 2x size for token
        .bold(true)
        .text(`#${tokenNum}`)
        .setSize(false, false)
        .bold(false)
        .feed(1)
        .divider('-', 32)
        .align('left')
        .text(`Dept: ${dept}`)
        .text(`Room: ${room}`)
        .text(`Date: ${new Date().toLocaleDateString()}`)
        .text(`Time: ${new Date().toLocaleTimeString()}`)
        .divider('-', 32)
        .align('center')
        .text("* Verified Doctor Consultation Required *")
        .feed(3)
        .cut();

    return formatter.getBytes();
}
