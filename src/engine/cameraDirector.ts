import * as THREE from 'three';
import { CameraMode } from '../types';
import { Car3DObject } from './vehiclePhysics';

export class CameraDirector {
  public currentMode: CameraMode = CameraMode.TRACKSIDE_TELEPHOTO;
  public camera: THREE.PerspectiveCamera;
  public isManualLocked: boolean = false;
  private currentTargetCarId: string = '';
  private dwellTimer: number = 0;
  private nextSwitchTime: number = 5.0; // 4.5 to 6.0 seconds per realistic broadcast shot
  private orbitAngle: number = 0;

  // Trạm quay phim ven đường tĩnh (Trackside Static Station) cho cảm giác truyền hình F1 chân thực
  private tracksideStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasStationPos: boolean = false;
  private grandstandStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasGrandstandPos: boolean = false;
  private spectatorStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasSpectatorPos: boolean = false;
  private helipadStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasHelipadPos: boolean = false;

  // Smoothing buffers for cinematic movement (Gimbal chống rung quang học)
  private smoothedCamPos: THREE.Vector3 = new THREE.Vector3(0, 10, 20);
  private smoothedLookTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isFirstFrame: boolean = true;

  // Gyro-stabilized broadcast tracking anchor: cách ly hoàn toàn rung giật va chạm
  private stabilizedAnchorPos: THREE.Vector3 = new THREE.Vector3();
  private stabilizedAnchorForward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private hasStabilizedAnchor: boolean = false;

  // Thời gian mô phỏng đồng bộ tuyệt đối với delta (triệt tiêu 100% hiện tượng lệch nhịp rung chấn)
  private simulatedTime: number = 0;

  // Tiêu cự quang học chuẩn thể thao: 68° góc rộng điện ảnh, mở rộng động lên 88° khi đạt 500 km/h
  private readonly BASE_FOV: number = 68;

  constructor(fov: number = 68, aspect: number = 16 / 9) {
    // Tăng near plane từ 0.1 lên 1.0 và far plane lên 30000 để bao quát trọn đường đua tới chân trời
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 1.0, 30000);
  }

  setCameraMode(mode: CameraMode, manualLock: boolean = true) {
    this.currentMode = mode;
    this.isManualLocked = manualLock;
    this.dwellTimer = 0;
    this.hasStationPos = false;
    this.hasGrandstandPos = false;
    this.hasSpectatorPos = false;
    this.hasHelipadPos = false;
    this.isFirstFrame = true; // Bắt tức thì vào vị trí góc quay mới, triệt tiêu việc bị cách xa hàng trăm mét
  }

  unlockAutoDirector() {
    this.isManualLocked = false;
    this.dwellTimer = 0;
    this.nextSwitchTime = 4.5 + Math.random() * 1.5;
  }

  resetFirstFrame() {
    this.isFirstFrame = true;
    this.hasStationPos = false;
    this.hasGrandstandPos = false;
    this.hasSpectatorPos = false;
    this.hasHelipadPos = false;
    this.hasStabilizedAnchor = false;
  }

  update(
    cars: Car3DObject[],
    delta: number,
    activeOvertakeCarId: string | null,
    collisionCarId: string | null,
    autoDirectorEnabled: boolean = true
  ): CameraMode {
    if (cars.length === 0) return this.currentMode;

    this.dwellTimer += delta;
    this.simulatedTime += delta;
    this.orbitAngle += delta * (this.currentMode === CameraMode.CINEMATIC_ORBIT ? 0.95 : 0.35);

    // Determine Leader (P1)
    const leaderCar = cars.find(c => c.state.rank === 1) || cars[0];

    // Priority event-driven director switches (Chuẩn đạo diễn truyền hình thể thao F1)
    // Tự động chuyển đổi mượt mà bao gồm đầy đủ các góc quay 1, 2, 3, 8, 12 với chu kỳ từ 4.5 đến 6.0 giây
    if (autoDirectorEnabled && !this.isManualLocked) {
      if (collisionCarId && this.dwellTimer >= 4.5) {
        // Sự kiện va chạm/drift: Đạo diễn ưu tiên cắt sang góc 8 (Va Chạm/Drift, Apex) và góc 3 (Sát mặt đường)
        const collisionCamModes = [
          CameraMode.COLLISION_DRIFT,          // Góc 8 (Điện ảnh): Va Chạm & Drift
          CameraMode.TRACKSIDE_APEX,           // Góc 8 (Truyền hình): Trạm quay mép cua Apex
          CameraMode.LOW_GROUND,               // Góc 3 (Điện ảnh): Sát mặt đường
          CameraMode.SKY_DRONE_BROADCAST,      // Góc 2 (Truyền hình): Drone bay siêu tốc
        ];
        this.currentMode = collisionCamModes[Math.floor(Math.random() * collisionCamModes.length)];
        this.currentTargetCarId = collisionCarId;
        this.dwellTimer = 0;
        this.nextSwitchTime = 4.5 + Math.random() * 1.5;
        this.hasStationPos = false;
        this.hasSpectatorPos = false;
      } else if (activeOvertakeCarId && this.dwellTimer >= 4.5) {
        // Sự kiện vượt xe: Bao gồm đầy đủ các góc quay 1, 2, 3, 8, 12 cùng các góc hành động
        const overtakeCamModes = [
          CameraMode.CHOPPER_HELI_CHASE,       // Góc 1 (Truyền hình): Trực thăng truyền hình
          CameraMode.BEHIND,                   // Góc 1 (Điện ảnh): Phía sau xe
          CameraMode.SKY_DRONE_BROADCAST,      // Góc 2 (Truyền hình): Drone bay siêu tốc
          CameraMode.MULTI_CAR_PACK_CHASE,     // Góc 2 (Điện ảnh): Bám đuôi đoàn xe 100m
          CameraMode.PANORAMIC,                // Góc 3 (Truyền hình): Toàn cảnh từ trên cao
          CameraMode.LOW_GROUND,               // Góc 3 (Điện ảnh): Sát mặt đường xé gió
          CameraMode.TRACKSIDE_APEX,           // Góc 8 (Truyền hình): Trạm quay mép cua Apex
          CameraMode.COLLISION_DRIFT,          // Góc 8 (Điện ảnh): Va Chạm & Drift
          CameraMode.VERTICAL_PORTRAIT_OPTIMIZED, // Góc 12 (Truyền hình): Khung hình dọc 9:16 Shorts/TikTok
          CameraMode.OVERTAKE_ACTION,
          CameraMode.MULTI_CAR_OVERTAKE_WIDE,
          CameraMode.MULTI_CAR_FRONT_FACING,
          CameraMode.SIDE_CHASE_MULTI,
          CameraMode.PASSING_STATIONARY,
          CameraMode.TRACKSIDE_TELEPHOTO,
          CameraMode.BUMPER_FIRST_PERSON
        ];
        this.currentMode = overtakeCamModes[Math.floor(Math.random() * overtakeCamModes.length)];
        this.currentTargetCarId = activeOvertakeCarId;
        this.dwellTimer = 0;
        this.nextSwitchTime = 4.5 + Math.random() * 1.5;
        this.hasStationPos = false;
        this.hasSpectatorPos = false;
      } else if (this.dwellTimer >= this.nextSwitchTime) {
        // Chuyển góc quay truyền hình thực tế: giữ mỗi góc 4.5 đến 6.0 giây để người xem thưởng thức trọn vẹn
        this.cycleNextCinematicMode();
        this.dwellTimer = 0;
        this.nextSwitchTime = 4.5 + Math.random() * 1.5;
        this.hasStationPos = false;
        this.hasGrandstandPos = false;
      }
    }

    // Select target car based on mode
    let targetCar = cars.find(c => c.state.id === this.currentTargetCarId);
    if (!targetCar || this.currentMode === CameraMode.LEADER_TRACKING) {
      targetCar = leaderCar;
      this.currentTargetCarId = targetCar.state.id;
    }

    const idealPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    const carPos = targetCar.group.position;
    const rawForward = new THREE.Vector3(0, 0, 1).applyQuaternion(targetCar.group.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // =========================================================================
    // HỆ THỐNG CON QUAY HỒI CHUYỂN CHỐNG RUNG TRUYỀN HÌNH (GYRO GIMBAL STABILIZER)
    // Cách ly hoàn toàn máy quay khỏi các cú giật nảy do va chạm hoặc đánh lái gắt.
    // =========================================================================
    const isCloseMode = (
      this.currentMode === CameraMode.BEHIND ||
      this.currentMode === CameraMode.HOOD ||
      this.currentMode === CameraMode.SIDE_PROFILE
    );

    if (!this.hasStabilizedAnchor || this.isFirstFrame) {
      this.stabilizedAnchorPos.copy(carPos);
      this.stabilizedAnchorForward.copy(rawForward);
      this.hasStabilizedAnchor = true;
    } else {
      if (isCloseMode) {
        // Giảm chấn quán tính siêu mượt (Damped Smoothing) cho hướng lái xe khi ôm cua
        this.stabilizedAnchorPos.copy(carPos);
        this.stabilizedAnchorForward.lerp(rawForward, Math.min(1.0, delta * 12.0)).normalize();
      } else {
        const anchorSmoothSpeed = Math.min(1.0, delta * 20.0);
        this.stabilizedAnchorPos.lerp(carPos, anchorSmoothSpeed);
        this.stabilizedAnchorForward.lerp(rawForward, Math.min(1.0, delta * 14.0)).normalize();
      }
    }

    const trackedPos = this.stabilizedAnchorPos;
    const forward = this.stabilizedAnchorForward;
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const currentSpeed = targetCar.state.speed || 0;

    // Tốc độ lerp máy quay (Smooth Damping factor)
    let camSmoothSpeed = 4.5;

    switch (this.currentMode) {
      // =========================================================================
      // GÓC QUAY TRỰC THĂNG TRUYỀN HÌNH TỪ XA (CHOPPER HELI CHASE)
      // Helicam bay lượn trên không ở cự ly vừa tầm, bắt trọn toàn bộ đoàn xe và khung cảnh trường đua
      // =========================================================================
      case CameraMode.CHOPPER_HELI_CHASE: {
        camSmoothSpeed = 16.0;
        const swayX = Math.sin(this.orbitAngle * 0.45) * 3.0;
        const swayY = Math.cos(this.orbitAngle * 0.35) * 1.5;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -20.0)
          .addScaledVector(right, 10.0 + swayX)
          .addScaledVector(up, 14.0 + swayY);
        lookTarget.copy(trackedPos).addScaledVector(forward, 10.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // GÓC QUAY DRONE BAY BÁM ĐUỔI TỪ XA (SKY DRONE BROADCAST / FLYCAM)
      // Drone FPV bay lướt gần hơn, chuyển động nhịp nhàng bám sát xe
      // =========================================================================
      case CameraMode.SKY_DRONE_BROADCAST: {
        camSmoothSpeed = 20.0;
        const droneWeave = Math.sin(this.orbitAngle * 0.75) * 2.5;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -12.0)
          .addScaledVector(right, droneWeave)
          .addScaledVector(up, 5.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 12.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // GÓC QUAY TOÀN CẢNH TỪ TRÊN CAO (PANORAMIC / GRANDSTAND)
      // =========================================================================
      case CameraMode.PANORAMIC: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -20.0)
          .addScaledVector(right, 16.0)
          .addScaledVector(up, 20.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 10.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 1. MÁY QUAY TELEPHOTO VEN ĐƯỜNG LIA THEO XE (TRACKSIDE TELEPHOTO 85mm)
      // Máy quay ĐỨNG YÊN 100% Ở VEN ĐƯỜNG KHÔNG DI CHUYỂN, chỉ xoay ống kính lia theo đoàn xe đi qua
      // =========================================================================
      case CameraMode.TRACKSIDE_TELEPHOTO: {
        const distToStation = trackedPos.distanceTo(this.tracksideStationPos);
        if (!this.hasStationPos || distToStation > 160.0) {
          this.tracksideStationPos.copy(trackedPos)
            .addScaledVector(right, 14.5)
            .addScaledVector(forward, 55.0);
          this.tracksideStationPos.y = trackedPos.y + 2.8;
          this.hasStationPos = true;
        }
        idealPos.copy(this.tracksideStationPos); // Đứng yên tuyệt đối ở ven đường!
        lookTarget.copy(trackedPos).addScaledVector(up, 0.85); // Chỉ lia ống kính theo xe
        break;
      }

      // =========================================================================
      // 2. TOÀN CẢNH SO KÈ NHIỀU XE (MULTI_CAR_OVERTAKE_WIDE)
      // Góc quay chéo từ trên cao vừa phải, bắt trọn từng pha đảo làn và so kè tay đôi
      // =========================================================================
      case CameraMode.MULTI_CAR_OVERTAKE_WIDE: {
        camSmoothSpeed = 12.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, 24.0)
          .addScaledVector(forward, -22.0)
          .addScaledVector(up, 12.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 15.0).addScaledVector(up, 1.1);
        break;
      }

      // =========================================================================
      // 3. GÓC ĐÓN ĐẦU NHIỀU XE ĐUA (MULTI_CAR_FRONT_FACING)
      // Đón đầu đoàn xe, quay trực diện vào xe và nhóm xe phía sau đang lao tới
      // =========================================================================
      case CameraMode.MULTI_CAR_FRONT_FACING: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, 38.0)
          .addScaledVector(up, 5.5)
          .addScaledVector(right, -3.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, -4.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 4. TRẠM QUAY ĐỈNH GÓC CUA APEX (TRACKSIDE APEX)
      // Đặt ngay mép vỉa cua (apex curb), đón xe ôm cua rõ nét với độ ổn định cao
      // =========================================================================
      case CameraMode.TRACKSIDE_APEX: {
        camSmoothSpeed = 25.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, 6.0)
          .addScaledVector(right, -4.5)
          .addScaledVector(up, 1.2);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 0.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 0.0).addScaledVector(up, 0.85);
        break;
      }

      // =========================================================================
      // 5. BÁM ĐUÔI ĐOÀN XE NGHẸT THỞ (MULTI_CAR_PACK_CHASE)
      // Cách sau xe 35m, trên cao 9.5m bao quát cận cảnh các xe so kè và đảo làn bứt tốc
      // =========================================================================
      case CameraMode.MULTI_CAR_PACK_CHASE: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -35.0)
          .addScaledVector(up, 9.5)
          .addScaledVector(right, 3.2);
        lookTarget.copy(trackedPos).addScaledVector(forward, 25.0).addScaledVector(up, 1.2);
        break;
      }

      // =========================================================================
      // 6. VÁCH KỸ THUẬT PIT WALL (PIT WALL BROADCAST)
      // Góc nhìn từ tường chỉ đạo pit stop nhìn đoàn xe xé gió đoạn thẳng
      // =========================================================================
      case CameraMode.PIT_WALL_BROADCAST: {
        camSmoothSpeed = 7.5;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -16.0)
          .addScaledVector(forward, 16.0)
          .addScaledVector(up, 3.2);
        lookTarget.copy(trackedPos).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 7. TRẠM QUAY TĨNH SÁT RÀO CHẮN XÉ GIÓ (PASSING STATIONARY)
      // Máy quay gắn sát rào chắn xé gió (Armco Barrier Rush), rào chắn và vạch sơn vút qua cực mượt mà
      // =========================================================================
      case CameraMode.PASSING_STATIONARY: {
        camSmoothSpeed = 10.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, 6.2)
          .addScaledVector(forward, -1.8)
          .addScaledVector(up, 1.25);
        lookTarget.copy(trackedPos)
          .addScaledVector(forward, 2.5)
          .addScaledVector(up, 0.75);
        break;
      }

      // =========================================================================
      // 9. KHUNG HÌNH DỌC 9:16 TRUYỀN HÌNH (VERTICAL PORTRAIT OPTIMIZED)
      // Cân chỉnh tỉ lệ vàng cho màn hình điện thoại (Shorts / Reels)
      // =========================================================================
      case CameraMode.VERTICAL_PORTRAIT_OPTIMIZED: {
        camSmoothSpeed = 24.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -11.0).addScaledVector(up, 3.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 14.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 10. GÓC QUAY NGƯỜI ĐỨNG VEN ĐƯỜNG (SPECTATOR TRACKSIDE)
      // Camera ĐỨNG YÊN 100% Ở VEN ĐƯỜNG KHÔNG DI CHUYỂN, chỉ xoay hướng lia nhìn theo xe tốc độ cao đi qua
      // =========================================================================
      case CameraMode.SPECTATOR_TRACKSIDE: {
        const distToSpectator = trackedPos.distanceTo(this.spectatorStationPos);
        if (!this.hasSpectatorPos || distToSpectator > 160.0) {
          this.spectatorStationPos.copy(trackedPos)
            .addScaledVector(right, 14.0)
            .addScaledVector(forward, 50.0);
          this.spectatorStationPos.y = trackedPos.y + 1.65; // Tầm mắt khán giả đứng ven đường
          this.hasSpectatorPos = true;
        }
        idealPos.copy(this.spectatorStationPos); // Tuyệt đối đứng yên!
        lookTarget.copy(trackedPos).addScaledVector(up, 0.85); // Chỉ lia ống kính theo thân xe
        break;
      }

      // =========================================================================
      // 10. HÔNG XA SO KÈ NHIỀU XE ĐUA (SIDE_CHASE_MULTI)
      // Chạy song song cạnh đoàn xe cách 32m, bao quát các xe đua đang so kè bánh xe
      // =========================================================================
      case CameraMode.SIDE_CHASE_MULTI: {
        camSmoothSpeed = 14.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -30.0)
          .addScaledVector(forward, 6.0)
          .addScaledVector(up, 6.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 8.0).addScaledVector(up, 1.2);
        break;
      }

      // =========================================================================
      // 13. CAMERA TRẦN HẦM HẤT XUỐNG SIÊU TỐC (TUNNEL_CEILING_FAST)
      // Gắn dọc trần hầm nhìn từ trên xuống cực kỳ kịch tính khi xe vút qua bên dưới
      // =========================================================================
      case CameraMode.TUNNEL_CEILING_FAST: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(forward, 15.0).addScaledVector(up, 6.2);
        lookTarget.copy(trackedPos).addScaledVector(forward, -2.0).addScaledVector(up, 0.5);
        break;
      }

      // =========================================================================
      // 14. CAMERA CHẮN BÙN NHÌN LỐP VÀ HÔNG XE (FENDER_WHEEL_LOOK)
      // Góc bám lốp xe trước bên hông, thấy rõ bánh xe quay tít mù khói và mặt đường trôi
      // =========================================================================
      case CameraMode.FENDER_WHEEL_LOOK: {
        camSmoothSpeed = 25.0; // Khóa cứng
        idealPos.copy(trackedPos)
          .addScaledVector(right, 1.85)
          .addScaledVector(forward, 1.25)
          .addScaledVector(up, 0.75);
        lookTarget.copy(trackedPos)
          .addScaledVector(right, 0.8)
          .addScaledVector(forward, -1.8)
          .addScaledVector(up, 0.45);
        break;
      }

      // =========================================================================
      // 15. ĐUÔI GIÓ NHÌN NGƯỢC VỀ TRƯỚC (WING_REAR_LOOK)
      // Gắn trên cánh gió sau nhìn vượt qua nóc xe về phía trước, cảm nhận tốc độ cực hạn
      // =========================================================================
      case CameraMode.WING_REAR_LOOK: {
        camSmoothSpeed = 25.0; // Khóa cứng
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -1.75)
          .addScaledVector(up, 1.6);
        lookTarget.copy(trackedPos)
          .addScaledVector(forward, 15.0)
          .addScaledVector(up, 0.95);
        break;
      }

      // =========================================================================
      // 16. CAMERA ÂM VỈA GỜ GIẢM TỐC (KERB_CAM_GROUND)
      // Nâng cao góc quay lên 1 mét so với mặt đường
      // =========================================================================
      case CameraMode.KERB_CAM_GROUND: {
        camSmoothSpeed = 20.0;
        idealPos.copy(trackedPos).addScaledVector(right, 3.2).addScaledVector(forward, 4.0).addScaledVector(up, 1.45);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 1.35);
        lookTarget.copy(trackedPos).addScaledVector(up, 1.55);
        break;
      }

      // =========================================================================
      // 17. GÓC LÁI THỨ NHẤT TRONG CABIN (COCKPIT_FIRST_PERSON)
      // Trải nghiệm trực tiếp bên trong buồng lái xe đua tốc độ cực cao
      // =========================================================================
      case CameraMode.COCKPIT_FIRST_PERSON: {
        camSmoothSpeed = 25.0; // Khóa cứng
        idealPos.copy(trackedPos).addScaledVector(forward, 0.15).addScaledVector(up, 1.05);
        lookTarget.copy(trackedPos).addScaledVector(forward, 35.0).addScaledVector(up, 0.95);
        break;
      }

      // =========================================================================
      // 18. GÓC CẢN TRƯỚC SIÊU TỐC (BUMPER_FIRST_PERSON)
      // Nâng cao góc quay cản trước lên 1 mét
      // =========================================================================
      case CameraMode.BUMPER_FIRST_PERSON: {
        camSmoothSpeed = 25.0; // Khóa cứng
        idealPos.copy(trackedPos).addScaledVector(forward, 1.85).addScaledVector(up, 1.55);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 1.4);
        lookTarget.copy(trackedPos).addScaledVector(forward, 40.0).addScaledVector(up, 1.55);
        break;
      }

      // =========================================================================
      // === 10 GÓC QUAY CINEMATIC KINH ĐIỂN (CLASSIC CAMERAS) ===
      // =========================================================================

      // 1. Phía Sau Xe: Ôm cua mượt mà tự nhiên, hướng lượn theo đuôi xe, giữ phẳng đường chân trời (Horizon Locking)
      case CameraMode.BEHIND: {
        camSmoothSpeed = 18.0;
        // Kéo camera gần hơn (13m thay vì 22m), hạ độ cao (2.8m thay vì 5.2m) để tạo hiệu ứng xé gió cực mạnh ở 600km/h
        const dist = 13.0; 
        const height = 2.8; 
        idealPos.copy(trackedPos).addScaledVector(forward, -dist).addScaledVector(up, height);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 1.4);
        lookTarget.copy(trackedPos).addScaledVector(forward, 22.0).addScaledVector(up, 1.1);
        break;
      }

      // 2. Mui Xe / Cockpit: Góc nhìn thấp từ nắp capo nhìn thẳng đường đua
      case CameraMode.HOOD: {
        camSmoothSpeed = 25.0; // Locked tightly to avoid visual sliding
        idealPos.copy(trackedPos).addScaledVector(forward, 1.1).addScaledVector(up, 0.92);
        lookTarget.copy(trackedPos).addScaledVector(forward, 38.0).addScaledVector(up, 0.85);
        break;
      }

      // 3. Sát Mặt Đường: Góc quay sát mặt đường lốp xe xé gió (đã nâng cao thêm 1 mét)
      case CameraMode.LOW_GROUND: {
        camSmoothSpeed = 25.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -5.0).addScaledVector(right, 1.3).addScaledVector(up, 1.55);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 1.4);
        lookTarget.copy(trackedPos).addScaledVector(forward, 25.0).addScaledVector(up, 1.75);
        break;
      }

      // 4. Bên Hông Xe: Quay ngang hông xe và các pha so kè bánh xe
      case CameraMode.SIDE_PROFILE: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(right, -4.8).addScaledVector(forward, 0.2).addScaledVector(up, 1.4);
        lookTarget.copy(trackedPos).addScaledVector(forward, 5.0).addScaledVector(up, 0.85);
        break;
      }

      // 5. Bám Xe Dẫn Đầu & Đoàn Đua: Tự động bám theo xe dẫn đầu với cự ly 28m bao quát đoàn xe
      case CameraMode.LEADER_TRACKING: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -28.0).addScaledVector(up, 7.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 18.0).addScaledVector(up, 1.1);
        break;
      }

      // 8. Góc Vượt Mặt: Cận cảnh hành động khi xe lách qua đối thủ
      case CameraMode.OVERTAKE_ACTION: {
        camSmoothSpeed = 18.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -3.8)
          .addScaledVector(forward, -5.5)
          .addScaledVector(up, 2.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 12.0).addScaledVector(up, 0.95);
        break;
      }

      // 9. Va Chạm & Drift: Góc truyền hình cận cảnh theo dõi pha so kè, tuyệt đối không rung lắc
      case CameraMode.COLLISION_DRIFT: {
        camSmoothSpeed = 18.0;
        const driftOffset = (targetCar.state.isDrifting ? -1 : 1) * 3.5;
        idealPos.copy(trackedPos).addScaledVector(right, driftOffset).addScaledVector(forward, -6.5).addScaledVector(up, 2.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 6.0).addScaledVector(up, 0.9);
        break;
      }

      // 10. Xoay 360 Vòng: Quỹ đạo xoay mượt mà liên tục quanh xe theo hệ trục cục bộ
      case CameraMode.CINEMATIC_ORBIT: {
        camSmoothSpeed = 18.0;
        const orbitRadius = 7.5;
        const orbitHeight = 2.2 + Math.sin(this.orbitAngle * 0.8) * 0.35;
        const orbitX = Math.sin(this.orbitAngle) * orbitRadius;
        const orbitZ = Math.cos(this.orbitAngle) * orbitRadius;
        idealPos.copy(trackedPos)
          .addScaledVector(right, orbitX)
          .addScaledVector(forward, orbitZ)
          .addScaledVector(up, orbitHeight);
        lookTarget.copy(trackedPos).addScaledVector(up, 0.75);
        break;
      }

      // Fallback: Mặc định chuyển về máy quay Telephoto ven đường
      default: {
        camSmoothSpeed = 7.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -10.0).addScaledVector(up, 3.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 7.0).addScaledVector(up, 0.95);
        break;
      }
    }

    // Camera Smoothing Damping (Quán tính quang học mượt mà)
    if (this.isFirstFrame) {
      this.smoothedCamPos.copy(idealPos);
      this.smoothedLookTarget.copy(lookTarget);
      this.isFirstFrame = false;
    } else {
      const isStationaryTrackside = (
        this.currentMode === CameraMode.TRACKSIDE_TELEPHOTO ||
        this.currentMode === CameraMode.SPECTATOR_TRACKSIDE
      );
      const isCloseShot = (
        this.currentMode === CameraMode.BEHIND ||
        this.currentMode === CameraMode.HOOD ||
        this.currentMode === CameraMode.SIDE_PROFILE ||
        this.currentMode === CameraMode.COCKPIT_FIRST_PERSON ||
        this.currentMode === CameraMode.BUMPER_FIRST_PERSON ||
        this.currentMode === CameraMode.FENDER_WHEEL_LOOK ||
        this.currentMode === CameraMode.WING_REAR_LOOK ||
        this.currentMode === CameraMode.TRACKSIDE_APEX ||
        this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED ||
        this.currentMode === CameraMode.LOW_GROUND ||
        this.currentMode === CameraMode.KERB_CAM_GROUND
      );

      if (isStationaryTrackside) {
        // Máy quay ven đường đứng yên hoàn toàn 100% không di chuyển, chỉ xoay ống kính lia theo xe
        this.smoothedCamPos.copy(idealPos);
        this.smoothedLookTarget.lerp(lookTarget, Math.min(1.0, delta * 14.0));
      } else {
        // Áp dụng bộ lọc quán tính siêu mượt (Cinematic Spring-Damper Damping) với độ trễ tối ưu
        // Kết hợp biên độ dao động hữu cơ nhẹ nhàng (Steadicam Broadcast Crane Float) tạo cảm giác như máy quay truyền hình thật
        const organicSwayX = Math.sin(this.simulatedTime * 1.4) * 0.06;
        const organicSwayY = Math.cos(this.simulatedTime * 1.1) * 0.06;
        const targetPosWithSway = idealPos.clone().add(new THREE.Vector3(organicSwayX, organicSwayY, 0));

        const smoothFactor = Math.min(1.0, delta * (camSmoothSpeed > 0 ? camSmoothSpeed : 8.0));
        this.smoothedCamPos.lerp(targetPosWithSway, smoothFactor);
        this.smoothedLookTarget.lerp(lookTarget, smoothFactor);
      }
    }

    // =========================================================================
    // DYNAMIC FOV & SPEED SENSATION:
    // Tiêu cự chuẩn từng thể loại: 85mm cho Telephoto ven đường, mở rộng xé gió cho Chase
    // =========================================================================
    const speedRatio = Math.min(1.0, currentSpeed / 610);
    let modeBaseFov = this.BASE_FOV;
    let speedFovBoost = Math.pow(speedRatio, 1.1) * 22.0;

    if (this.currentMode === CameraMode.CHOPPER_HELI_CHASE) {
      modeBaseFov = 52.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 10.0;
    } else if (this.currentMode === CameraMode.SKY_DRONE_BROADCAST) {
      modeBaseFov = 68.0; // Góc Drone FPV lướt sát
      speedFovBoost = Math.pow(speedRatio, 1.1) * 16.0;
    } else if (this.currentMode === CameraMode.PANORAMIC) {
      modeBaseFov = 48.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 8.0;
    } else if (this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED) {
      modeBaseFov = 64.0; // Khung hình dọc 9:16 cảm nhận tốc độ lướt
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.LOW_GROUND || this.currentMode === CameraMode.KERB_CAM_GROUND) {
      modeBaseFov = 78.0; // Sát mặt đường xé gió
      speedFovBoost = Math.pow(speedRatio, 1.1) * 24.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_OVERTAKE_WIDE) {
      modeBaseFov = 58.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 12.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_FRONT_FACING) {
      modeBaseFov = 66.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_PACK_CHASE) {
      modeBaseFov = 62.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 15.0;
    } else if (this.currentMode === CameraMode.SIDE_CHASE_MULTI) {
      modeBaseFov = 58.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.SPECTATOR_TRACKSIDE) {
      const distToCam = this.smoothedCamPos.distanceTo(trackedPos);
      const zoomFactor = THREE.MathUtils.clamp((distToCam - 15.0) / 100.0, 0.0, 1.0);
      modeBaseFov = THREE.MathUtils.lerp(58.0, 22.0, zoomFactor);
      speedFovBoost = Math.pow(speedRatio, 1.2) * 6.0;
    } else if (this.currentMode === CameraMode.BEHIND) {
      // Góc phía sau xe: FOV 65 độ + tăng tới 24 độ khi 600km/h (tổng FOV gần 90 độ), tạo cảm giác warp-speed siêu xe
      modeBaseFov = 65.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 24.0;
    } else if (this.currentMode === CameraMode.COCKPIT_FIRST_PERSON) {
      modeBaseFov = 82.0; // Khoang lái góc rộng
      speedFovBoost = Math.pow(speedRatio, 1.1) * 25.0;
    } else if (this.currentMode === CameraMode.BUMPER_FIRST_PERSON) {
      modeBaseFov = 90.0; // Góc cản trước xé gió siêu tốc
      speedFovBoost = Math.pow(speedRatio, 1.1) * 28.0;
    } else if (this.currentMode === CameraMode.TRACKSIDE_TELEPHOTO) {
      modeBaseFov = 32.0; 
      speedFovBoost = Math.pow(speedRatio, 1.2) * 6.0;
    } else if (this.currentMode === CameraMode.TRACKSIDE_APEX) {
      modeBaseFov = 68.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.CINEMATIC_ORBIT) {
      modeBaseFov = 68.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.PASSING_STATIONARY) {
      modeBaseFov = 78.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 22.0;
    } else if (this.currentMode === CameraMode.TUNNEL_CEILING_FAST) {
      modeBaseFov = 78.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.FENDER_WHEEL_LOOK || this.currentMode === CameraMode.WING_REAR_LOOK) {
      modeBaseFov = 76.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    }

    const targetFov = modeBaseFov + speedFovBoost;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1.0, delta * 6.0));
    this.camera.updateProjectionMatrix();

    // Rung máy quay vi chấn khí động học tốc độ cao (Speed Aerodynamic Vibration):
    // Khi tốc độ trên 350 km/h, áp lực gió cực lớn tạo độ rung nhẹ tự nhiên cho ống kính máy quay
    let finalCamPos = this.smoothedCamPos.clone();
    if (currentSpeed > 350) {
      const shakeIntensity = Math.pow((currentSpeed - 350) / 300, 1.5) * 0.045;
      const shakeX = (Math.sin(performance.now() * 0.045) + Math.sin(performance.now() * 0.078)) * shakeIntensity;
      const shakeY = (Math.cos(performance.now() * 0.052) + Math.cos(performance.now() * 0.091)) * shakeIntensity * 0.6;
      finalCamPos.addScaledVector(right, shakeX).addScaledVector(up, shakeY);
    }

    this.camera.position.copy(finalCamPos);
    this.camera.lookAt(this.smoothedLookTarget);

    return this.currentMode;
  }

  /**
   * Chuyển đổi tự động giữa các góc quay truyền hình & cinematic, đặc biệt tích hợp dày đặc các góc 1, 2, 3, 8, 12
   */
  private cycleNextCinematicMode() {
    // Nhóm góc quay trọng tâm theo yêu cầu: 1, 2, 3, 8, 12 (cả Truyền hình & Điện ảnh)
    const priorityKeyModes = [
      CameraMode.CHOPPER_HELI_CHASE,          // Góc 1 (Truyền hình): Trực thăng truyền hình
      CameraMode.BEHIND,                      // Góc 1 (Điện ảnh): Phía sau xe
      CameraMode.SKY_DRONE_BROADCAST,         // Góc 2 (Truyền hình): Drone bay siêu tốc
      CameraMode.MULTI_CAR_PACK_CHASE,        // Góc 2 (Điện ảnh): Bám đuôi đoàn xe 100m
      CameraMode.PANORAMIC,                   // Góc 3 (Truyền hình): Toàn cảnh từ trên cao
      CameraMode.LOW_GROUND,                  // Góc 3 (Điện ảnh): Sát mặt đường xé gió
      CameraMode.TRACKSIDE_APEX,              // Góc 8 (Truyền hình): Trạm quay mép cua Apex
      CameraMode.COLLISION_DRIFT,             // Góc 8 (Điện ảnh): Va Chạm & Drift
      CameraMode.VERTICAL_PORTRAIT_OPTIMIZED, // Góc 12 (Truyền hình): Khung hình dọc 9:16 Shorts/TikTok
    ];

    const otherCinematicModes = [
      CameraMode.MULTI_CAR_FRONT_FACING,
      CameraMode.MULTI_CAR_OVERTAKE_WIDE,
      CameraMode.TRACKSIDE_TELEPHOTO,
      CameraMode.PASSING_STATIONARY,
      CameraMode.PIT_WALL_BROADCAST,
      CameraMode.SPECTATOR_TRACKSIDE,
      CameraMode.SIDE_CHASE_MULTI,
      CameraMode.TUNNEL_CEILING_FAST,
      CameraMode.FENDER_WHEEL_LOOK,
      CameraMode.WING_REAR_LOOK,
      CameraMode.KERB_CAM_GROUND,
      CameraMode.HOOD,
      CameraMode.SIDE_PROFILE,
      CameraMode.LEADER_TRACKING,
      CameraMode.OVERTAKE_ACTION,
      CameraMode.CINEMATIC_ORBIT,
      CameraMode.COCKPIT_FIRST_PERSON,
      CameraMode.BUMPER_FIRST_PERSON,
    ];

    // Xác suất 65% chọn một trong các góc quay trọng tâm 1, 2, 3, 8, 12 để người xem luôn thấy các góc này xuất hiện liên tục
    let candidatePool: CameraMode[];
    if (Math.random() < 0.65) {
      candidatePool = priorityKeyModes;
    } else {
      candidatePool = otherCinematicModes;
    }

    const available = candidatePool.filter(m => m !== this.currentMode);
    if (available.length > 0) {
      this.currentMode = available[Math.floor(Math.random() * available.length)];
    } else {
      const fallback = priorityKeyModes.filter(m => m !== this.currentMode);
      this.currentMode = fallback[Math.floor(Math.random() * fallback.length)] || CameraMode.CHOPPER_HELI_CHASE;
    }
  }
}
