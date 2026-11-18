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
      phong_khach: {
        area_id: 'phong_khach',
        name: 'Phòng Khách',
        icon: 'mdi:sofa',
      },
      phong_ngu: {
        area_id: 'phong_ngu',
        name: 'Phòng Ngủ Master',
        icon: 'mdi:bed',
      },
      phong_bep: {
        area_id: 'phong_bep',
        name: 'Phòng Bếp',
        icon: 'mdi:silverware-fork-knife',
      },
      phong_tam: {
        area_id: 'phong_tam',
        name: 'Phòng Tắm Thông Minh',
        icon: 'mdi:shower',
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
      'light.den_phong_khach': {
        entity_id: 'light.den_phong_khach',
        state: 'on',
        attributes: {
          friendly_name: 'Đèn Trần Phòng Khách',
          icon: 'mdi:lightbulb-on',
          brightness: 215, // ~84%
          supported_color_modes: ['brightness'],
        },
      },
      'light.den_chum_phong_khach': {
        entity_id: 'light.den_chum_phong_khach',
        state: 'off',
        attributes: {
          friendly_name: 'Đèn Chùm Pha Lê',
          icon: 'mdi:lightbulb-outline',
          brightness: 0,
        },
      },
      'climate.dieu_hoa_phong_khach': {
        entity_id: 'climate.dieu_hoa_phong_khach',
        state: 'cool',
        attributes: {
          friendly_name: 'Điều Hòa Daikin Inverter',
          icon: 'mdi:air-conditioner',
          current_temperature: 24.5,
          temperature: 22.0,
          min_temp: 16,
          max_temp: 30,
          hvac_modes: ['off', 'cool', 'heat', 'fan_only', 'auto'],
          hvac_action: 'cooling',
        },
      },
      'cover.rem_cua_phong_khach': {
        entity_id: 'cover.rem_cua_phong_khach',
        state: 'open',
        attributes: {
          friendly_name: 'Rèm Cửa Ban Công',
          icon: 'mdi:curtains-open',
          current_position: 75,
        },
      },
      'fan.quat_tran_phong_khach': {
        entity_id: 'fan.quat_tran_phong_khach',
        state: 'on',
        attributes: {
          friendly_name: 'Quạt Trần Panasonic',
          icon: 'mdi:fan',
          percentage: 60,
        },
      },
      'media_player.tv_phong_khach': {
        entity_id: 'media_player.tv_phong_khach',
        state: 'playing',
        attributes: {
          friendly_name: 'Sony Bravia OLED 65"',
          icon: 'mdi:television-ambient-light',
          media_title: 'Lối Nhỏ (Acoustic)',
          media_artist: 'Đen Vâu ft. Phương Anh Đào',
          entity_picture: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
          volume_level: 0.45,
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
        state: 'sunny',
        attributes: {
          friendly_name: 'Thời Tiết Hà Nội',
          temperature: 29,
          humidity: 68,
        },
      },
    };

    // 3. Entity -> Area mappings
    this.entities = {
      // Khách
      'light.den_phong_khach': { entity_id: 'light.den_phong_khach', area_id: 'phong_khach' },
      'light.den_chum_phong_khach': { entity_id: 'light.den_chum_phong_khach', area_id: 'phong_khach' },
      'climate.dieu_hoa_phong_khach': { entity_id: 'climate.dieu_hoa_phong_khach', area_id: 'phong_khach' },
      'cover.rem_cua_phong_khach': { entity_id: 'cover.rem_cua_phong_khach', area_id: 'phong_khach' },
      'fan.quat_tran_phong_khach': { entity_id: 'fan.quat_tran_phong_khach', area_id: 'phong_khach' },
      'media_player.tv_phong_khach': { entity_id: 'media_player.tv_phong_khach', area_id: 'phong_khach' },
      'switch.may_loc_khong_khi': { entity_id: 'switch.may_loc_khong_khi', area_id: 'phong_khach' },
      'sensor.nhiet_do_phong_khach': { entity_id: 'sensor.nhiet_do_phong_khach', area_id: 'phong_khach' },
      'sensor.do_am_phong_khach': { entity_id: 'sensor.do_am_phong_khach', area_id: 'phong_khach' },

      // Ngủ
      'light.den_ngu_master': { entity_id: 'light.den_ngu_master', area_id: 'phong_ngu' },
      'climate.dieu_hoa_phong_ngu': { entity_id: 'climate.dieu_hoa_phong_ngu', area_id: 'phong_ngu' },
      'cover.rem_cua_phong_ngu': { entity_id: 'cover.rem_cua_phong_ngu', area_id: 'phong_ngu' },
      'switch.robot_hut_bui': { entity_id: 'switch.robot_hut_bui', area_id: 'phong_ngu' },

      // Bếp
      'light.den_bep': { entity_id: 'light.den_bep', area_id: 'phong_bep' },
      'light.den_ban_an': { entity_id: 'light.den_ban_an', area_id: 'phong_bep' },
      'switch.may_hut_mui': { entity_id: 'switch.may_hut_mui', area_id: 'phong_bep' },

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
