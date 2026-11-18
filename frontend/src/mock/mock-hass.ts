/**
 * HomeSmart - Interactive Standalone Mock HASS State Machine
 * Realistic Vietnamese Smart Home Demo Harness
 */

import {
  AreaRegistryEntry,
  DeviceRegistryEntry,
  EntityRegistryEntry,
  HassEntities,
  HomeAssistant,
  HomeSmartConfig,
} from '../types';

export class MockHassMachine {
  private states: HassEntities = {};
  private areas: Record<string, AreaRegistryEntry> = {};
  private devices: Record<string, DeviceRegistryEntry> = {};
  private entities: Record<string, EntityRegistryEntry> = {};
  private subscribers: Array<(hass: HomeAssistant) => void> = [];

  constructor() {
    this.initMockData();
  }

  private initMockData(): void {
    // 1. Vietnamese Areas
    this.areas = {
      bep: {
        area_id: 'bep',
        name: 'Bếp',
        icon: 'mdi:silverware-fork-knife',
      },
      phong_khach: {
        area_id: 'phong_khach',
        name: 'Phòng khách',
        icon: 'mdi:sofa',
      },
      ban_cong: {
        area_id: 'ban_cong',
        name: 'Ban công',
        icon: 'mdi:tree',
      },
      phong_bep: {
        area_id: 'phong_bep',
        name: 'Phòng bếp',
        icon: 'mdi:silverware-fork-knife',
      },
      an_ninh: {
        area_id: 'an_ninh',
        name: 'An Ninh & Cổng',
        icon: 'mdi:shield-home',
      },
    };

    // 2. Mock States
    this.states = {
      // --- Phòng Khách ---
      'cover.man_ru_1': {
        entity_id: 'cover.man_ru_1',
        state: 'open',
        attributes: {
          friendly_name: 'Màn rủ',
          icon: 'mdi:curtains-open',
          current_position: 100,
        },
      },
      'cover.man_ru_2': {
        entity_id: 'cover.man_ru_2',
        state: 'open',
        attributes: {
          friendly_name: 'Màn rủ',
          icon: 'mdi:curtains-open',
          current_position: 100,
        },
      },
      'media_player.tv_phong_khach': {
        entity_id: 'media_player.tv_phong_khach',
        state: 'off',
        attributes: {
          friendly_name: 'TV phòng khách',
          icon: 'mdi:television-ambient-light',
        },
      },
      'vacuum.x40_master': {
        entity_id: 'vacuum.x40_master',
        state: 'docked',
        attributes: {
          friendly_name: 'X40 Master',
          icon: 'mdi:robot',
          status: 'docked',
        },
      },
      'select.ban_do_da_chon': {
        entity_id: 'select.ban_do_da_chon',
        state: 'Bản đồ',
        attributes: {
          friendly_name: 'Bản đồ đã chọn',
          icon: 'mdi:list',
          options: ['Bản đồ', 'Tầng 1', 'Tầng 2'],
        },
      },
      'select.chat_lieu_san_1': {
        entity_id: 'select.chat_lieu_san_1',
        state: 'tile',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 1',
          icon: 'mdi:list',
          options: ['tile', 'wood'],
        },
      },
      'select.chat_lieu_san_2': {
        entity_id: 'select.chat_lieu_san_2',
        state: 'tile',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 2',
          icon: 'mdi:list',
          options: ['tile', 'wood'],
        },
      },
      'select.chat_lieu_san_3': {
        entity_id: 'select.chat_lieu_san_3',
        state: 'wood',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 3',
          icon: 'mdi:list',
          options: ['wood', 'tile'],
        },
      },
      'select.chat_lieu_san_4': {
        entity_id: 'select.chat_lieu_san_4',
        state: 'wood',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 4',
          icon: 'mdi:list',
          options: ['wood', 'tile'],
        },
      },
      'select.chat_lieu_san_5': {
        entity_id: 'select.chat_lieu_san_5',
        state: 'wood',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 5',
          icon: 'mdi:list',
          options: ['wood', 'tile'],
        },
      },
      'select.chat_lieu_san_6': {
        entity_id: 'select.chat_lieu_san_6',
        state: 'wood',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 6',
          icon: 'mdi:list',
          options: ['wood', 'tile'],
        },
      },
      'select.chat_lieu_san_7': {
        entity_id: 'select.chat_lieu_san_7',
        state: 'tile',
        attributes: {
          friendly_name: 'Chất liệu sàn Phòng 7',
          icon: 'mdi:list',
          options: ['tile', 'wood'],
        },
      },
      'select.che_do_cleangenius': {
        entity_id: 'select.che_do_cleangenius',
        state: 'CleanGenius',
        attributes: {
          friendly_name: 'Chế độ CleanGenius',
          icon: 'mdi:list',
          options: ['CleanGenius', 'Tự động', 'Thủ công'],
        },
      },
      'select.che_do_giat_gie': {
        entity_id: 'select.che_do_giat_gie',
        state: 'lau',
        attributes: {
          friendly_name: 'Chế độ giặt giẻ lau',
          icon: 'mdi:list',
          options: ['lau', 'giặt sâu', 'tiết kiệm'],
        },
      },
      'select.che_do_lam_sach': {
        entity_id: 'select.che_do_lam_sach',
        state: 'mopping_after...',
        attributes: {
          friendly_name: 'Chế độ làm sạch',
          icon: 'mdi:list',
          options: ['mopping_after...', 'vacuum_then_mop'],
        },
      },
      'select.che_do_do_rac': {
        entity_id: 'select.che_do_do_rac',
        state: 'high_frequency',
        attributes: {
          friendly_name: 'Chế độ tự động đổ rác',
          icon: 'mdi:list',
          options: ['high_frequency', 'standard', 'low'],
        },
      },
      'select.cleangenius': {
        entity_id: 'select.cleangenius',
        state: 'off',
        attributes: {
          friendly_name: 'CleanGenius',
          icon: 'mdi:list',
          options: ['off', 'daily', 'deep'],
        },
      },
      'select.do_am_gie_lau': {
        entity_id: 'select.do_am_gie_lau',
        state: 'moist',
        attributes: {
          friendly_name: 'Độ ẩm giẻ lau',
          icon: 'mdi:list',
          options: ['moist', 'wet', 'dry'],
        },
      },
      'light.den_phong_khach': {
        entity_id: 'light.den_phong_khach',
        state: 'off',
        attributes: {
          friendly_name: 'Đèn Trần Phòng Khách',
          icon: 'mdi:lightbulb-outline',
          brightness: 0,
        },
      },
      'climate.dieu_hoa_phong_khach': {
        entity_id: 'climate.dieu_hoa_phong_khach',
        state: 'off',
        attributes: {
          friendly_name: 'Điều Hòa Daikin Inverter',
          icon: 'mdi:air-conditioner',
          current_temperature: 24.5,
          temperature: 22.0,
          min_temp: 16,
          max_temp: 30,
        },
      },
      'switch.may_loc_khong_khi': {
        entity_id: 'switch.may_loc_khong_khi',
        state: 'on',
        attributes: {
          friendly_name: 'Máy Lọc Không Khí Xiaomi Pro',
          icon: 'mdi:power',
        },
      },
      'sensor.nhiet_do_phong_khach': {
        entity_id: 'sensor.nhiet_do_phong_khach',
        state: '24.5',
        attributes: {
          friendly_name: 'Nhiệt Độ',
          icon: 'mdi:gauge',
          unit_of_measurement: '°C',
        },
      },
      'sensor.do_am_phong_khach': {
        entity_id: 'sensor.do_am_phong_khach',
        state: '62',
        attributes: {
          friendly_name: 'Độ Ẩm',
          icon: 'mdi:gauge',
          unit_of_measurement: '%',
        },
      },

      // --- Phòng Ngủ Master ---
      'light.den_ngu_master': {
        entity_id: 'light.den_ngu_master',
        state: 'on',
        attributes: {
          friendly_name: 'Đèn Ngủ Master',
          icon: 'mdi:lightbulb-on',
          brightness: 120, // ~47%
          supported_color_modes: ['brightness'],
        },
      },
      'climate.dieu_hoa_phong_ngu': {
        entity_id: 'climate.dieu_hoa_phong_ngu',
        state: 'cool',
        attributes: {
          friendly_name: 'Điều Hòa Panasonic',
          icon: 'mdi:air-conditioner',
          current_temperature: 25.5,
          temperature: 24.0,
          min_temp: 16,
          max_temp: 30,
          hvac_modes: ['off', 'cool', 'fan_only', 'auto'],
          hvac_action: 'cooling',
        },
      },
      'cover.rem_cua_phong_ngu': {
        entity_id: 'cover.rem_cua_phong_ngu',
        state: 'closed',
        attributes: {
          friendly_name: 'Rèm Cuộn Chống Nắng',
          icon: 'mdi:curtains',
          current_position: 0,
        },
      },
      'switch.robot_hut_bui': {
        entity_id: 'switch.robot_hut_bui',
        state: 'off',
        attributes: {
          friendly_name: 'Robot Hút Bụi Roborock S8',
          icon: 'mdi:power',
        },
      },

      // --- Phòng Bếp ---
      'light.den_bep': {
        entity_id: 'light.den_bep',
        state: 'on',
        attributes: {
          friendly_name: 'Đèn Bàn Bếp',
          icon: 'mdi:lightbulb-on',
          brightness: 255,
        },
      },
      'light.den_ban_an': {
        entity_id: 'light.den_ban_an',
        state: 'off',
        attributes: {
          friendly_name: 'Đèn Thả Bàn Ăn',
          icon: 'mdi:lightbulb-outline',
          brightness: 0,
        },
      },
      'switch.may_hut_mui': {
        entity_id: 'switch.may_hut_mui',
        state: 'off',
        attributes: {
          friendly_name: 'Máy Hút Mùi Bosch',
          icon: 'mdi:fan',
        },
      },

      // --- Phòng Tắm Thông Minh ---
      'light.den_guong_tam': {
        entity_id: 'light.den_guong_tam',
        state: 'on',
        attributes: {
          friendly_name: 'Đèn Gương Cảm Ứng LED',
          icon: 'mdi:lightbulb-on',
          brightness: 180,
          supported_color_modes: ['brightness'],
        },
      },
      'water_heater.binh_nong_lanh_tam': {
        entity_id: 'water_heater.binh_nong_lanh_tam',
        state: 'on',
        attributes: {
          friendly_name: 'Bình Nóng Lạnh Ariston',
          icon: 'mdi:water-boiler',
          current_temperature: 58,
          temperature: 65,
        },
      },
      'switch.den_suoi_tam': {
        entity_id: 'switch.den_suoi_tam',
        state: 'off',
        attributes: {
          friendly_name: 'Đèn Sưởi Âm Trần Kottmann',
          icon: 'mdi:power',
        },
      },

      // --- An Ninh & Cổng ---
      'lock.khoa_cua_chinh': {
        entity_id: 'lock.khoa_cua_chinh',
        state: 'locked',
        attributes: {
          friendly_name: 'Khóa Cửa Thông Minh Kaadas',
          icon: 'mdi:lock',
        },
      },
      'cover.cua_cuon_gara': {
        entity_id: 'cover.cua_cuon_gara',
        state: 'closed',
        attributes: {
          friendly_name: 'Cửa Cuốn Tự Động Austdoor',
          icon: 'mdi:garage',
          current_position: 0,
        },
      },
      'camera.camera_san_truoc': {
        entity_id: 'camera.camera_san_truoc',
        state: 'idle',
        attributes: {
          friendly_name: 'Camera Sân Trước 4K HDR',
          icon: 'mdi:cctv',
          entity_picture: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=600&q=80',
        },
      },

      // --- Weather ---
      'weather.nha': {
        entity_id: 'weather.nha',
        state: 'rainy',
        attributes: {
          friendly_name: 'Nhà',
          temperature: 27,
          humidity: 86,
          wind_speed: 9,
          wind_speed_unit: 'km/h',
          precipitation_probability: 30,
          forecast: [
            { datetime: '2026-11-18T10:00:00', condition: 'rainy', temperature: 28, templow: 20, precipitation_probability: 30 },
            { datetime: '2026-11-19T10:00:00', condition: 'cloudy', temperature: 22, templow: 19 },
            { datetime: '2026-11-20T10:00:00', condition: 'cloudy', temperature: 20, templow: 17 },
            { datetime: '2026-11-21T10:00:00', condition: 'partlycloudy', temperature: 20, templow: 16 },
            { datetime: '2026-11-22T10:00:00', condition: 'sunny', temperature: 24, templow: 18 },
            { datetime: '2026-11-23T10:00:00', condition: 'partlycloudy', temperature: 25, templow: 19 },
          ],
        },
      },
    };

    // 3. Entity -> Area mappings
    this.entities = {
      // Bếp
      'light.den_bep': { entity_id: 'light.den_bep', area_id: 'bep' },
      'light.den_ban_an': { entity_id: 'light.den_ban_an', area_id: 'bep' },
      'switch.may_hut_mui': { entity_id: 'switch.may_hut_mui', area_id: 'bep' },

      // Phòng Khách (Matching Screenshot Layout)
      'cover.man_ru_1': { entity_id: 'cover.man_ru_1', area_id: 'phong_khach' },
      'cover.man_ru_2': { entity_id: 'cover.man_ru_2', area_id: 'phong_khach' },
      'media_player.tv_phong_khach': { entity_id: 'media_player.tv_phong_khach', area_id: 'phong_khach' },
      'vacuum.x40_master': { entity_id: 'vacuum.x40_master', area_id: 'phong_khach' },
      'select.ban_do_da_chon': { entity_id: 'select.ban_do_da_chon', area_id: 'phong_khach' },
      'select.chat_lieu_san_1': { entity_id: 'select.chat_lieu_san_1', area_id: 'phong_khach' },
      'select.chat_lieu_san_2': { entity_id: 'select.chat_lieu_san_2', area_id: 'phong_khach' },
      'select.chat_lieu_san_3': { entity_id: 'select.chat_lieu_san_3', area_id: 'phong_khach' },
      'select.chat_lieu_san_4': { entity_id: 'select.chat_lieu_san_4', area_id: 'phong_khach' },
      'select.chat_lieu_san_5': { entity_id: 'select.chat_lieu_san_5', area_id: 'phong_khach' },
      'select.chat_lieu_san_6': { entity_id: 'select.chat_lieu_san_6', area_id: 'phong_khach' },
      'select.chat_lieu_san_7': { entity_id: 'select.chat_lieu_san_7', area_id: 'phong_khach' },
      'select.che_do_cleangenius': { entity_id: 'select.che_do_cleangenius', area_id: 'phong_khach' },
      'select.che_do_giat_gie': { entity_id: 'select.che_do_giat_gie', area_id: 'phong_khach' },
      'select.che_do_lam_sach': { entity_id: 'select.che_do_lam_sach', area_id: 'phong_khach' },
      'select.che_do_do_rac': { entity_id: 'select.che_do_do_rac', area_id: 'phong_khach' },
      'select.cleangenius': { entity_id: 'select.cleangenius', area_id: 'phong_khach' },
      'select.do_am_gie_lau': { entity_id: 'select.do_am_gie_lau', area_id: 'phong_khach' },
      'light.den_phong_khach': { entity_id: 'light.den_phong_khach', area_id: 'phong_khach' },
      'climate.dieu_hoa_phong_khach': { entity_id: 'climate.dieu_hoa_phong_khach', area_id: 'phong_khach' },

      // Ban công
      'switch.tuoi_cay_ban_cong': { entity_id: 'switch.tuoi_cay_ban_cong', area_id: 'ban_cong' },

      // Phòng bếp
      'switch.may_loc_nuoc': { entity_id: 'switch.may_loc_nuoc', area_id: 'phong_bep' },

      // Tắm
      'light.den_guong_tam': { entity_id: 'light.den_guong_tam', area_id: 'phong_tam' },
      'water_heater.binh_nong_lanh_tam': { entity_id: 'water_heater.binh_nong_lanh_tam', area_id: 'phong_tam' },
      'switch.den_suoi_tam': { entity_id: 'switch.den_suoi_tam', area_id: 'phong_tam' },

      // An Ninh
      'lock.khoa_cua_chinh': { entity_id: 'lock.khoa_cua_chinh', area_id: 'an_ninh' },
      'cover.cua_cuon_gara': { entity_id: 'cover.cua_cuon_gara', area_id: 'an_ninh' },
      'camera.camera_san_truoc': { entity_id: 'camera.camera_san_truoc', area_id: 'an_ninh' },
    };
  }

  public getHass(): HomeAssistant {
    return {
      states: { ...this.states },
      areas: { ...this.areas },
      devices: { ...this.devices },
      entities: { ...this.entities },
      language: 'vi',
      locale: { language: 'vi' },
      callService: this.callService.bind(this),
      callWS: this.callWS.bind(this),
    };
  }

  public subscribe(cb: (hass: HomeAssistant) => void): () => void {
    this.subscribers.push(cb);
    cb(this.getHass());
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify(): void {
    const hass = this.getHass();
    for (const sub of this.subscribers) {
      sub(hass);
    }
  }

  public async callService(domain: string, service: string, serviceData?: Record<string, any>): Promise<any> {
    if (domain === 'scene') {
      const sceneId = serviceData?.entity_id || '';
      if (sceneId.includes('away') || sceneId.includes('sleep')) {
        for (const [id, ent] of Object.entries(this.states)) {
          if (id.startsWith('light.')) ent.state = 'off';
        }
      } else if (sceneId.includes('home')) {
        for (const [id, ent] of Object.entries(this.states)) {
          if (id.startsWith('light.')) ent.state = 'on';
        }
      }
      this.notify();
      return { success: true };
    }

    const entityId = serviceData?.entity_id;
    if (!entityId || !this.states[entityId]) return;

    const ent = { ...this.states[entityId] };
    const attrs = { ...ent.attributes };

    switch (service) {
      case 'toggle':
        ent.state = ent.state === 'on' ? 'off' : 'on';
        if (ent.state === 'on' && attrs.brightness === 0) attrs.brightness = 255;
        break;

      case 'turn_on':
        ent.state = 'on';
        if (serviceData?.brightness_pct !== undefined) {
          attrs.brightness = Math.round((serviceData.brightness_pct / 100) * 255);
        }
        break;

      case 'turn_off':
        ent.state = 'off';
        break;

      case 'set_cover_position':
        if (serviceData?.position !== undefined) {
          attrs.current_position = serviceData.position;
          ent.state = serviceData.position === 0 ? 'closed' : 'open';
        }
        break;

      case 'open_cover':
        attrs.current_position = 100;
        ent.state = 'open';
        break;

      case 'close_cover':
        attrs.current_position = 0;
        ent.state = 'closed';
        break;

      case 'stop_cover':
        break;

      case 'set_percentage':
        if (serviceData?.percentage !== undefined) {
          attrs.percentage = serviceData.percentage;
          ent.state = serviceData.percentage === 0 ? 'off' : 'on';
        }
        break;

      case 'set_temperature':
        if (serviceData?.temperature !== undefined) {
          attrs.temperature = serviceData.temperature;
        }
        break;

      case 'set_hvac_mode':
        if (serviceData?.hvac_mode) {
          ent.state = serviceData.hvac_mode;
          attrs.hvac_action = serviceData.hvac_mode === 'off' ? 'idle' : 'cooling';
        }
        break;

      case 'lock':
        ent.state = 'locked';
        break;

      case 'unlock':
        ent.state = 'unlocked';
        break;

      case 'media_play_pause':
        ent.state = ent.state === 'playing' ? 'paused' : 'playing';
        break;

      case 'volume_set':
        if (serviceData?.volume_level !== undefined) {
          attrs.volume_level = serviceData.volume_level;
        }
        break;
    }

    ent.attributes = attrs;
    this.states[entityId] = ent;
    this.notify();
    return { success: true };
  }

  public async callWS<T = any>(msg: { type: string; [key: string]: any }): Promise<T> {
    if (msg.type === 'homesmart/config/get') {
      const stored = localStorage.getItem('homesmart_mock_config');
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch (_) {}
      }
      return null as any;
    }

    if (msg.type === 'homesmart/config/save') {
      localStorage.setItem('homesmart_mock_config', JSON.stringify(msg.config));
      return { success: true } as any;
    }

    return null as any;
  }
}
