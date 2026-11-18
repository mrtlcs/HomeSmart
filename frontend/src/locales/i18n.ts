/**
 * HomeSmart - Bilingual Localization (Vietnamese default & English)
 */

import { LocaleId } from '../types';

export const translations = {
  vi: {
    // App & Layout
    app_title: 'HomeSmart',
    all_areas: 'Tất cả khu vực',
    unassigned: 'Thiết bị khác',
    overview: 'Tổng quan',
    lights_active: 'đèn đang bật',
    devices_active: 'thiết bị đang chạy',
    no_entities: 'Không tìm thấy thiết bị nào trong khu vực này.',
    tap_to_wake: 'Chạm màn hình hoặc nhấn phím bất kỳ để đánh thức',

    // States
    state_on: 'Bật',
    state_off: 'Tắt',
    state_open: 'Đang mở',
    state_closed: 'Đang đóng',
    state_opening: 'Đang mở lên',
    state_closing: 'Đang đóng lại',
    state_locked: 'Đã khóa',
    state_unlocked: 'Mở khóa',
    state_heat: 'Sưởi ấm',
    state_cool: 'Làm mát',
    state_auto: 'Tự động',
    state_fan_only: 'Chỉ quạt',
    state_dry: 'Hút ẩm',
    state_playing: 'Đang phát',
    state_paused: 'Tạm dừng',
    state_idle: 'Chờ',
    state_home: 'Ở nhà',
    state_not_home: 'Vắng nhà',
    state_unavailable: 'Không khả dụng',

    // Controls
    brightness: 'Độ sáng',
    cover_position: 'Độ mở',
    fan_speed: 'Tốc độ quạt',
    temperature: 'Nhiệt độ',
    current_temp: 'Hiện tại',
    target_temp: 'Cài đặt',
    volume: 'Âm lượng',
    source: 'Nguồn phát',
    open_btn: 'Mở',
    stop_btn: 'Dừng',
    close_btn: 'Đóng',
    power_btn: 'Nguồn',

    // Themes
    theme_aurora: 'Bắc Cực Quang (Aurora)',
    theme_ocean: 'Đại Dương Xanh (Ocean)',
    theme_wine: 'Rượu Vang Đỏ (Wine)',
    theme_graphite: 'Than Chì (Graphite)',
    theme_emerald: 'Ngọc Lục Bảo (Emerald)',
    theme_sunset: 'Hoàng Hôn (Sunset)',

    // Layouts
    layout_auto: 'Tự động thích ứng',
    layout_sidebar: 'Thanh điều hướng bên',
    layout_focus: 'Tập trung (Focus)',
    layout_grid: 'Lưới Bento cân xứng',
    layout_tv: 'Màn hình TV (10-Foot UI)',

    // Visual Editor
    visual_editor: 'Tùy Biến Giao Diện',
    edit_mode: 'Chế độ sửa',
    exit_edit: 'Hoàn tất',
    save_sync: 'Lưu & Đồng Bộ',
    saving: 'Đang lưu...',
    saved_success: 'Đã lưu cấu hình lên Home Assistant!',
    save_error: 'Lỗi khi lưu cấu hình. Vui lòng thử lại.',
    theme_select: 'Chủ đề kính mờ',
    layout_select: 'Bố cục hiển thị',
    screensaver_toggle: 'Bảo vệ màn hình OLED',
    screensaver_timeout: 'Thời gian chờ kích hoạt',
    language_select: 'Ngôn ngữ',
    card_size: 'Kích thước thẻ',
    card_protection: 'Cơ chế bảo vệ',
    prot_none: 'Bình thường',
    prot_confirm: 'Xác nhận chạm 2 lần',
    prot_pin: 'Mã PIN 4 số',
    hide_card: 'Ẩn thẻ này',
    show_all_hidden: 'Hiện tất cả thẻ đã ẩn',
    edit_card_settings: 'Cài đặt thẻ',

    // Protected Modal
    confirm_title: 'Xác Nhận Thao Tác',
    confirm_msg: 'Bạn có chắc chắn muốn thao tác trên thiết bị an ninh này không?',
    pin_title: 'Yêu Cầu Mã PIN',
    pin_msg: 'Vui lòng nhập mã PIN bảo mật 4 số để tiếp tục:',
    incorrect_pin: 'Mã PIN không đúng. Vui lòng nhập lại!',
    cancel: 'Hủy bỏ',
    confirm: 'Xác nhận',
    clear: 'Xóa',
  },

  en: {
    // App & Layout
    app_title: 'HomeSmart',
    all_areas: 'All Areas',
    unassigned: 'Other Devices',
    overview: 'Overview',
    lights_active: 'lights turned on',
    devices_active: 'devices active',
    no_entities: 'No devices found in this area.',
    tap_to_wake: 'Tap screen or press any key to wake',

    // States
    state_on: 'On',
    state_off: 'Off',
    state_open: 'Open',
    state_closed: 'Closed',
    state_opening: 'Opening',
    state_closing: 'Closing',
    state_locked: 'Locked',
    state_unlocked: 'Unlocked',
    state_heat: 'Heat',
    state_cool: 'Cool',
    state_auto: 'Auto',
    state_fan_only: 'Fan Only',
    state_dry: 'Dry',
    state_playing: 'Playing',
    state_paused: 'Paused',
    state_idle: 'Idle',
    state_home: 'Home',
    state_not_home: 'Away',
    state_unavailable: 'Unavailable',

    // Controls
    brightness: 'Brightness',
    cover_position: 'Position',
    fan_speed: 'Fan Speed',
    temperature: 'Temperature',
    current_temp: 'Current',
    target_temp: 'Target',
    volume: 'Volume',
    source: 'Source',
    open_btn: 'Open',
    stop_btn: 'Stop',
    close_btn: 'Close',
    power_btn: 'Power',

    // Themes
    theme_aurora: 'Aurora Borealis',
    theme_ocean: 'Deep Ocean',
    theme_wine: 'Ruby Wine',
    theme_graphite: 'Graphite Slate',
    theme_emerald: 'Cyber Emerald',
    theme_sunset: 'Golden Sunset',

    // Layouts
    layout_auto: 'Auto Responsive',
    layout_sidebar: 'Sidebar Navigation',
    layout_focus: 'Focus Mode',
    layout_grid: 'Bento Grid',
    layout_tv: 'TV Console (10-Foot UI)',

    // Visual Editor
    visual_editor: 'Visual Customizer',
    edit_mode: 'Edit Mode',
    exit_edit: 'Done',
    save_sync: 'Save & Sync',
    saving: 'Saving...',
    saved_success: 'Dashboard configuration saved to Home Assistant!',
    save_error: 'Failed to save configuration. Please try again.',
    theme_select: 'Glassmorphism Theme',
    layout_select: 'Layout Mode',
    screensaver_toggle: 'OLED Screensaver',
    screensaver_timeout: 'Screensaver Timeout',
    language_select: 'Language',
    card_size: 'Card Size',
    card_protection: 'Protection Guard',
    prot_none: 'None',
    prot_confirm: 'Double-Tap Confirm',
    prot_pin: '4-Digit PIN Code',
    hide_card: 'Hide Card',
    show_all_hidden: 'Unhide All Cards',
    edit_card_settings: 'Card Settings',

    // Protected Modal
    confirm_title: 'Confirm Action',
    confirm_msg: 'Are you sure you want to trigger this protected device?',
    pin_title: 'Security PIN Required',
    pin_msg: 'Enter the 4-digit security PIN to proceed:',
    incorrect_pin: 'Incorrect PIN code. Please try again!',
    cancel: 'Cancel',
    confirm: 'Confirm',
    clear: 'Clear',
  },
};

export function t(key: string, locale: LocaleId = 'vi'): string {
  const dict = translations[locale] || translations.vi;
  return (dict as any)[key] || (translations.en as any)[key] || key;
}
