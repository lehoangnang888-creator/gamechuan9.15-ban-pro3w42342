/**
 * AI Racing Commentary Generator - Kho Thoại Bình Luận Viên Phong Phú Đỉnh Cao
 * Hỗ trợ tạo tự động HÀNG TRIỆU BIẾN THỂ KẾT HỢP (Combinatorial Dialogue Matrix)
 * Phong cách Trẻ Trâu TikTok / YouTube / F1 Viral & Hài Hước Bùng Nổ
 */

export type CommentaryCategory =
  | 'START'
  | 'NITRO'
  | 'DRIFT'
  | 'OVERTAKE'
  | 'BATTLE'
  | 'SLIPSTREAM'
  | 'COLLISION'
  | 'FINISH'
  | 'LEADER'
  | 'CRASH_SAVE';

export interface GeneratedCommentaryLine {
  id: string;
  category: CommentaryCategory;
  driverName: string;
  text: string;
  durationSec: number;
  intensity: 'NORMAL' | 'HIGH' | 'MAXIMUM';
}

export interface ScheduledTimelineEvent {
  clipId: string;
  type: string;
  driver: string;
  text: string;
  startSec: number;
  durationSec: number;
  audioBuffer?: AudioBuffer | null;
  pcmLeft?: Float32Array | null;
  pcmRight?: Float32Array | null;
  sampleRate?: number;
}

// 1. MA TRẬN MỞ MÀN / CẢM XÚC HYPE (25 HOOKS)
const HOOKS = [
  "Úi giời ơi anh em ơi!",
  "Kính thưa toàn thể 500 anh em đang nín thở theo dõi!",
  "Chấn động địa cầu, rúng động cả trường đua!",
  "Đèn xanh vừa bật sáng lóa cả màn hình!",
  "Trời đất ơi, một pha xử lý không thể tin vào mắt mình!",
  "Xem kìa anh em ơi, chuyện gì đang xảy ra thế này?!",
  "Cả trường đua đang rung chuyển từng mét đường nhựa bốc khói!",
  "Mùi cao su cháy khét lẹt xộc thẳng vào buồng bình luận rồi!",
  "Tốc độ này thì đồng hồ công-tơ-mét cũng phải vỡ kính hiển thị!",
  "Ối dồi ôi, hôm nay uống nhầm lon tăng lực hay sao mà chạy khiếp thế?!",
  "Không thể đỉnh hơn được nữa quý vị ơi!",
  "Bình luận viên rụng rời tay chân, tim đập thình thịch 200 nhịp!",
  "Lạy chúa tôi, một khoảnh khắc xứng đáng đi thẳng vào sách giáo khoa!",
  "Toàn bộ khán đài đồng loạt đứng bật dậy gào thét khản cổ!",
  "Pha xử lý đẳng cấp vũ trụ vừa được tái hiện trên đường đua!",
  "Bá cháy bọ chét luôn anh em ơi!",
  "Tổ lái nhập rồi, chính thức bật chế độ siêu nhân!",
  "Hú hồn chim én, một pha ra xe khiến tim người xem muốn rớt ra ngoài!",
  "Đỉnh nóc, kịch trần, bay phấp phới luôn anh em ơi!",
  "Ngả mũ bái phục, tài nghệ ôm vô lăng này ai mà đỡ cho nổi!",
  "Căng như dây đàn, nghẹt thở đến từng phần trăm giây!",
  "Cảnh tượng điên rồ nhất mà tôi từng chứng kiến trong 20 năm làm nghề!",
  "Alo alo, ban tổ chức đâu rồi, có ai gắn tên lửa vào đuôi xe không vậy?!",
  "Tắt thở chưa quý vị ơi, nhìn pha này mà mắt chữ A mồm chữ O!",
  "Một đẳng cấp quá khác biệt, không thể tìm ra điểm chê!"
];

export interface DriverProfile {
  name: string;
  aliases: string[];
  signatureGag: string;
  shoutout: string;
}

export const DRIVER_PROFILES: Record<string, DriverProfile> = {
  'Lionel Messi': {
    name: 'Lionel Messi',
    aliases: ['M10', 'El Pulga Bọ Chét', 'Anh Mười', 'Phù Thủy Xứ Rosario', 'Vua Rê Dắt'],
    signatureGag: 'ôm cua dính chặt vào vỉa đường như bóng dính keo vào chân',
    shoutout: 'Đỉnh cao rê dắt, đối thủ ngơ ngác như mất phương hướng!'
  },
  'Cristiano Ronaldo': {
    name: 'Cristiano Ronaldo',
    aliases: ['CR7', 'Anh Bảy', 'Chủ Tịch Ronaldo', 'Cỗ Máy Chiến Đấu', 'Anh Bảy Siuuu'],
    signatureGag: 'vừa đạp lút ga vừa hét vang trời Siuuu chấn động khán đài',
    shoutout: 'Siuuuu! Một phong độ hủy diệt không thể ngăn cản!'
  },
  'Neymar Jr': {
    name: 'Neymar Jr',
    aliases: ['Neymar', 'Ảo Thuật Gia Samba', 'Tiểu Pelé', 'Vũ Công Tốc Độ', 'Neymar Jr.'],
    signatureGag: 'lạng lách múa lửa dẻo như kẹo kéo khiến đối thủ hoa hết mắt',
    shoutout: 'Múa lửa đỉnh chóp, đối thủ chỉ biết ngắm nhìn nghệ thuật!'
  },
  'David Beckham': {
    name: 'David Beckham',
    aliases: ['Becks', 'Quý Ông Đường Cong', 'Chuyên Gia Cầu Vồng', 'Beckham Lịch Lãm'],
    signatureGag: 'vẽ nên một đường cong quỹ đạo hoàn hảo như sút phạt quả chuối',
    shoutout: 'Đường cong tuyệt mỹ, quý ông làng tốc độ chính là đây!'
  },
  'Kylian Mbappe': {
    name: 'Kylian Mbappé',
    aliases: ['Ninja Rùa', 'Tên Lửa Đất Đối Đất', 'Thần Tốc Mbappe', 'Kylian Siêu Tốc'],
    signatureGag: 'bật động cơ phản lực phóng đi nhanh hơn cả bóng ma',
    shoutout: 'Nhanh như chớp giật, camera góc quay quét theo không kịp!'
  },
  'Ronaldinho': {
    name: 'Ronaldinho',
    aliases: ['Rô Vẩu', 'Nụ Cười Samba', 'Ảo Thuật Gia Túc Cầu', 'Phù Thủy Rô Vẩu'],
    signatureGag: 'vừa ôm vô lăng vừa nở nụ cười rạng rỡ chào các thiếu nữ trên khán đài',
    shoutout: 'Vui vẻ không quạu, đua xe mà ngỡ đang khiêu vũ trên bãi biển Copacabana!'
  },
  'Ronaldo Nazário': {
    name: 'Ronaldo Nazário',
    aliases: ['Rô Béo', 'Người Ngoài Hành Tinh', 'O Fenômeno R9', 'Cỗ Xe Tăng Siêu Cấp'],
    signatureGag: 'càn quét đường đua nuốt trọn mọi khúc cua như ăn tiệc buffet',
    shoutout: 'Sức mạnh ngoài hành tinh, đè bẹp mọi giới hạn vật lý thông thường!'
  },
  'Zinedine Zidane': {
    name: 'Zinedine Zidane',
    aliases: ['Zizou', 'Bậc Thầy Com-pa', 'Chiến Lược Gia Tốc Độ', 'Huyền Thoại Zizou'],
    signatureGag: 'xoay com-pa 360 độ điệu nghệ thoát hiểm trong gang tấc',
    shoutout: 'Pha đảo người com-pa kinh điển, quá tao nhã và chuẩn xác!'
  },
  'Pelé': {
    name: 'Pelé',
    aliases: ['Vua Pelé', 'Vua Tốc Độ Bất Tử', 'Huyền Thoại Số 10', 'Ngôi Sao Nam Mỹ'],
    signatureGag: 'thể hiện bản lĩnh của bậc đế vương không hề nao núng',
    shoutout: 'Đẳng cấp vĩnh cửu, kinh nghiệm chinh chiến dày dặn phát huy tối đa!'
  },
  'Zlatan Ibrahimović': {
    name: 'Zlatan Ibrahimović',
    aliases: ['Thánh Ibra', 'Sư Tử Thụy Điển', 'Kẻ Thách Thức Trọng Lực', 'Ibracadabra'],
    signatureGag: 'tuyên bố đường đua này là của Zlatan và không bao giờ biết đạp phanh',
    shoutout: 'Sư tử không bao giờ so sánh mình với con người, Zlatan là bất bại!'
  },
  'Diego Maradona': {
    name: 'Diego Maradona',
    aliases: ['Cậu Bé Vàng Maradona', 'Bàn Tay Phép Thuật', 'Huyền Thoại Bất Diệt'],
    signatureGag: 'bẻ lái một cú ngoạn mục như cú chạm bóng thế kỷ vào lưới',
    shoutout: 'Cảm xúc bùng nổ, linh hồn đường đua rực cháy!'
  },
  'Trùm Cuối Vô Danh': {
    name: 'Trùm Cuối Vô Danh',
    aliases: ['Quái Kiệt Ẩn Danh', 'Tay Đua Bí Ẩn', 'Hắc Mã Xóm Đua', 'Bóng Ma Đường Đêm'],
    signatureGag: 'xuất quỷ nhập thần với kỹ thuật tổ lái gia truyền không ai lường trước',
    shoutout: 'Cao thủ ẩn mình trong bóng tối, xuất chiêu là lấy mạng đối thủ!'
  }
};

const ACTIONS: Record<CommentaryCategory, string[]> = {
  START: [
    "đạp lút cán ga, buông côn chuẩn từng mi-li-giây, cỗ máy V12 phóng vọt đi như tên lửa đạn đạo",
    "phản xạ tia chớp vọt lên ngay khi tín hiệu đèn vừa đổi màu, lốp xe bốc khói mịt mù cày nát vạch xuất phát",
    "bứt tốc kinh hoàng chiếm trọn làn trong, bỏ lại toàn bộ đối thủ đang lúng túng nhìn nhau",
    "khởi động cú đề-pa hoàn hảo không một vết gợn, đầu xe chồm lên xé toạc luồng gió sớm",
    "nhả phanh tay lao vút đi với gia tốc vũ bão khiến người lái dính chặt lưng vào ghế ngồi",
    "phóng như đạn bắn khỏi nòng súng, tiếng bô nổ giòn giã đinh tai nhức óc cả trường đua",
    "ôm gọn vạch xuất phát, bánh xe quay tít mù khói cuốn phăng mọi sự nghi ngờ của ban giám khảo",
    "thể hiện kỹ năng xuất phát gia truyền, xe lao vút về phía trước như mãnh hổ xuất sơn"
  ],
  NITRO: [
    "kích hoạt bình Nitro NOS phụt tia lửa xanh lét, tốc độ nhảy vọt lên hơn 600 km/h xé toạc không gian",
    "nhấn nút Nitro đỏ rực trên vô lăng, hai ống xả khạc lửa dài cả mét đẩy xe bay như máy bay phản lực",
    "xả trọn bình khí nén tăng áp kép, kim đồng hồ tốc độ quay tít mù vượt qua mọi giới hạn thiết kế",
    "phụt tia plasma cực quang rực sáng, cỗ máy gầm thét như con thú hoang xé gió lướt đi vun vút",
    "bơm trọn vẹn nitro vào buồng đốt, vận tốc khủng khiếp làm cảnh vật xung quanh nhòe đi như phim viễn tưởng",
    "bứt tốc xé gió, áp lực âm thanh phá vỡ bức tường âm thanh khiến mặt đường rung chuyển",
    "kích hoạt chế độ siêu tăng áp, xe phóng đi nhanh đến nỗi camera truyền hình bắt nét không kịp",
    "phụt lửa đỏ rực phía sau đuôi xe, tạo ra một luồng khí cuộn trào quét sạch cát bụi trên mặt đường"
  ],
  DRIFT: [
    "giật phanh tay bẻ lái ngược 90 độ, đuôi xe quét một vòng cung bốc khói khét lẹt sát mép vỉa ba-ri-e",
    "ôm cua với góc nghiêng hoàn hảo, vệt lốp cao su in hằn đen sì trên mặt đường nhựa nóng bỏng",
    "drift một pha nghệ thuật đỉnh cao theo phong cách Tokyo Drift, thân xe trượt ngang đẹp mắt như tranh vẽ",
    "vê vô lăng điệu nghệ kiểm soát góc trượt hoàn hảo, không lệch dù chỉ nửa milimet khỏi tâm đường",
    "quét đuôi xe sát rạt hàng rào bảo vệ, tia lửa cọ xát bắn tung tóe như pháo hoa đêm giao thừa",
    "chuyển trọng tâm liên hoàn lướt qua góc cua chữ Z mượt mà êm ái như một vũ công ba-lê",
    "ôm cua góc chết với vận tốc điên rồ, lốp xe rít lên ken két gào khóc trong sự phấn khích của người xem",
    "thực hiện cú drift quét vỉa thần thánh, bụi đường bay mù mịt tạo nên khung cảnh điện ảnh ngoạn mục"
  ],
  OVERTAKE: [
    "lách người qua khe hẹp sát mép cỏ chỉ vừa khít thân xe, vượt mặt đối thủ trong một cái chớp mắt",
    "đảo làn chữ S chớp nhoáng, tạt đầu đối thủ để lại làn khói cay sè mắt kèm một cái vẫy tay chào thân ái",
    "chớp thời cơ đối thủ ôm cua rộng, luồn vào góc trong bứt tốc vượt lên dẫn đầu không một động tác thừa",
    "vượt mặt ngoạn mục ngay trước vạch báo cua, đối thủ chỉ biết trơ mắt đứng nhìn cản sau xa dần",
    "ra đòn quyết định ở khúc cua định mệnh, lách qua hai xe kẹp săng-uých khiến cả trường đua nổ tung",
    "đè vạch ngoài rồi đột ngột cắt mặt vào trong, một pha vượt xe xứng đáng được chiếu lại 100 lần",
    "nhấp nháy đèn pha xin đường rồi nhấn ga vượt qua nhẹ như một cơn gió thoảng qua đời nhau",
    "bắt bài hoàn toàn ý đồ phòng thủ của đối phương, ung dung vượt lên chiếm lấy vị trí dẫn đầu"
  ],
  BATTLE: [
    "so kè từng cen-ti-mét bánh chạm bánh tóe lửa, hai cỗ máy chiến tranh gầm rú tranh giành từng tấc đất",
    "bám sát nhau như hình với bóng ở vận tốc 550 km/h, không ai chịu nhường ai dù chỉ nửa vòng bánh xe",
    "hai tay lái đại tài ăn miếng trả miếng liên tục, liên tục đảo làn cản đường nghẹt thở từng tích tắc",
    "cuộc chiến không khoan nhượng của hai gã khổng lồ tốc độ, tiếng động cơ gầm vang rúng động bầu trời",
    "bánh xe cọ xát vào nhau tóe lửa xè xè, một màn so găng căng thẳng tột độ khiến khán giả muốn ngưng thở",
    "so kè tay đôi nghẹt thở suốt từ đầu đoạn thẳng đến tận cửa góc cua tử thần",
    "ép nhau sát rạt mép tường bê-tông, chỉ cần sơ sẩy một li là cả hai cùng dắt tay nhau vào gara sửa chữa",
    "hai con quái vật kim loại so kè từng phần nghìn giây, cuộc đua đang nóng lên đến 1000 độ C"
  ],
  SLIPSTREAM: [
    "núp sát đuôi xe phía trước hút trọn luồng gió động học, tích tụ áp lực chờ thời cơ bung lụa",
    "bám đuôi ở cự ly chỉ 50 centimet, tận dụng hiệu ứng núp gió slipstream để gia tăng vận tốc lên cực đại",
    "chui vào vùng chân không phía sau đối thủ, xe lướt đi nhẹ bẫng chuẩn bị cho cú phóng tên lửa vượt mặt",
    "hút trọn luồng khí cuộn sau đuôi, kim đồng hồ tốc độ nhích lên từng nấc từng nấc đầy đe dọa"
  ],
  COLLISION: [
    "va chạm tóe lửa tung tóe, gõ nhẹ vào cản sau cảnh cáo đối thủ nhưng vẫn giữ vững tay lái thần sầu",
    "cọ xát cản trước vào thành rào chắn bắn pháo hoa rực rỡ nhưng cỗ máy bọc thép vẫn lao đi vun vút",
    "pha va chạm nảy lửa làm vỡ vụn sợi carbon khí động học, nhưng ý chí chiến thắng vẫn rực cháy nguyên vẹn",
    "thân xe va vào nhau kêu một tiếng chát chúa, cả hai tay đua vẫn lạnh lùng ghì chặt vô lăng tiếp tục cuộc chiến"
  ],
  FINISH: [
    "lao qua vạch đích đầu tiên với vận tốc âm thanh xé toạc lá cờ caro ca khúc khải hoàn",
    "cán đích vẻ vang giật cúp vô địch trong tiếng hò reo cuồng nhiệt như sấm dậy của hàng vạn cổ động viên",
    "về nhất thuyết phục tuyệt đối bỏ xa nhóm bám đuổi cả một đoạn đường dài bất tận",
    "xé gió lao qua cổng chào vinh quang, khắc tên mình lên đỉnh cao lịch sử trường đua danh giá",
    "cán vạch đích nghẹt thở với khoảng cách chỉ vỏn vẹn một phần trăm giây, giật trọn huy chương vàng danh giá",
    "về đích số một, chiếc xe lết bánh ăn mừng xoay tròn tạo thành những vòng khói trắng tuyệt mỹ",
    "hoàn thành chặng đua huyền thoại với kỷ lục thời gian mới không ai có thể xô đổ",
    "giật cúp vô địch trong sự ngỡ ngàng và thán phục tuyệt đối của tất cả các đối thủ sừng sỏ"
  ],
  LEADER: [
    "ung dung dẫn đầu đoàn đua với khoảng cách an toàn, làm chủ cuộc chơi từ đầu đến cuối",
    "dẫn đoàn xe xé gió băng băng về phía trước như một vị tướng lĩnh chỉ huy quân đoàn siêu xe",
    "bỏ lại toàn bộ khói bụi phía sau, một mình một ngựa băng băng trên đại lộ vinh quang"
  ],
  CRASH_SAVE: [
    "suýt chút nữa thì toang nhưng pha cứu lái xuất thần đã giữ chiếc xe thăng bằng ngay trên mép vực thẳm",
    "bánh xe mất lái xoay vòng nhưng tay đua đã bình tĩnh giật số kéo phanh cứu sống cả mùa giải"
  ]
};

const FUNNY_STAKES = [
  "để kịp phóng về nhà nấu cơm tối kẻo bị vợ khóa cửa bắt ngủ ngoài hành lang!",
  "kiếm tiền thưởng nóng chuộc lại chiếc nhẫn kim cương bị cắm tạm ở tiệm cầm đồ!",
  "trả dứt điểm món nợ bát phở bò tái gầu thơm phức từ tuần trước chưa thanh toán!",
  "chạy trốn tổ tuần tra giao thông đang đứng chờ lập biên bản ở khúc cua phía trước!",
  "khao toàn thể 500 anh em trong xóm một chầu lẩu cá kèo no nê ngập răng!",
  "giành lấy bản hợp đồng quảng cáo dầu gội đầu trị giá 10 triệu đô la Mỹ!",
  "để chứng minh cho cả thế giới và cô người yêu cũ thấy ai mới là vua tốc độ thực thụ!",
  "chạy nhanh đến mức gió lốc thổi bay cả nón bảo hiểm lẫn kính râm của trọng tài!",
  "khiến máy bắn tốc độ của ban tổ chức bốc khói nổ tung vì nhảy số quá nhanh!",
  "làm cho các đối thủ phía sau chỉ biết ngậm ngùi hít khói cay xè mắt trong bất lực!",
  "khiến ban tổ chức phải cấp tốc gọi hai xe cứu hỏa vì mặt đường đang cháy rực!",
  "về đích xong phải chạy vội đi đón con kẻo cô giáo mầm non lại gọi điện mách bố mẹ!",
  "chạy như bị mẹ cầm chổi đuổi đằng sau, không có bất kỳ lý do gì để giảm tốc độ!",
  "để không phải rửa bát dọn nhà trong suốt một tháng tới theo kèo cá cược với đồng đội!",
  "chứng minh đẳng cấp xe mượn của bạn thân chạy còn bốc hơn cả xe của chính mình!",
  "kiếm tiền đổ đầy bình xăng đang chạm đáy chuông báo đỏ liên hồi!",
  "chạy nhanh hơn cả vận tốc người yêu cũ lật mặt khi chia tay!",
  "khiến toàn bộ các camera giám sát góc cua phải quay cuồng tìm bóng dáng xe!",
  "đáp lại lời thách đấu ngông cuồng của tay đua đối thủ vào tối hôm qua trên mạng xã hội!",
  "giữ vững danh hiệu tay lái lụa số một hành tinh không cho ai có cơ hội chạm vào!"
];

const OUTROS = [
  "Quá đẳng cấp, thực sự không còn từ ngữ nào để miêu tả nổi sự hoàn hảo này!",
  "Siuuu vang vọng từ mặt đất lên đến tận chín tầng mây xanh!",
  "Xứng đáng điểm mười không có nhưng, ban giám khảo phải gật gù bái phục!",
  "Đúng là gừng càng già càng cay, quái kiệt làng tốc độ tái xuất giang hồ!",
  "Đẳng cấp là mãi mãi, phong độ là nhất thời, đối thủ chỉ biết ngả mũ chào thua!",
  "Xem mà nổi hết cả da gà da vịt, quá đã mắt anh em ơi!",
  "Một siêu phẩm đua xe để đời của thế kỷ 21, ghi tên vào lịch sử muôn đời!",
  "Ai chê tay lái này thì bước ra đây solo ngay và luôn đi nào!",
  "Khán giả đang gào thét đến lạc cả giọng, không khí nóng hơn cả chảo lửa!",
  "Cháy hết mình trên từng cen-ti-mét đường đua, tuyệt đối đỉnh chóp!",
  "Pha xử lý mang tính biểu tượng, xem đi xem lại 10 lần vẫn thấy rùng mình!",
  "Không hổ danh là niềm tự hào của xóm đua, tài năng xuất chúng!",
  "Một tràng pháo tay giòn giã cho pha biểu diễn nghệ thuật tốc độ đỉnh cao này!",
  "Thế này thì ai mà chịu nổi nhiệt, quá tàn nhẫn với đối phương!",
  "Một khoảnh khắc ma thuật khiến triệu con tim thổn thức khôn nguôi!",
  "Cạn lời luôn rồi quý vị ơi, chỉ có thể thốt lên hai từ: Tuyệt Đỉnh!",
  "Chiến thắng ngọt ngào xóa tan mọi hoài nghi của giới mộ điệu!",
  "Chạy thế này thì đến thần gió cũng phải đứng sang một bên cúi đầu chào!",
  "Tốc độ ánh sáng cũng chỉ ngang ngửa pha bứt phá vừa rồi mà thôi!",
  "Hết nước chấm, chấm hết mọi hy vọng bám đuổi của nhóm xe phía sau!"
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function pickRandom<T>(array: T[], seed: number): T {
  const idx = Math.floor(pseudoRandom(seed) * array.length);
  return array[idx % array.length];
}

/**
 * Tạo câu bình luận biến thể tổ hợp phong phú, hàng triệu cách kết hợp
 */
export function generateDynamicCommentary(options: {
  category: CommentaryCategory;
  driverName?: string;
  seed?: number;
  instanceId?: number;
  speedKmh?: number;
  targetDriver?: string;
  rank?: number;
}): GeneratedCommentaryLine {
  const s = options.seed || Math.floor(Math.random() * 1000000);
  const cat = options.category || 'OVERTAKE';
  const rawDriverName = options.driverName || 'Cristiano Ronaldo';
  
  let profile = DRIVER_PROFILES[rawDriverName];
  if (!profile) {
    const key = Object.keys(DRIVER_PROFILES).find(k => rawDriverName.toLowerCase().includes(k.toLowerCase()));
    if (key) {
      profile = DRIVER_PROFILES[key];
    } else {
      profile = {
        name: rawDriverName,
        aliases: [rawDriverName, `Tay đua ${rawDriverName}`, `Siêu sao ${rawDriverName}`],
        signatureGag: 'ôm vô lăng xử lý với độ chính xác đến từng mi-li-giây',
        shoutout: 'Đẳng cấp vượt trội thể hiện rõ qua từng khúc cua hiểm trở!'
      };
    }
  }

  const hook = pickRandom(HOOKS, s);
  const alias = pickRandom(profile.aliases, s + 13);
  const actionList = ACTIONS[cat] || ACTIONS.OVERTAKE;
  const action = pickRandom(actionList, s + 29);
  const funnyStake = pickRandom(FUNNY_STAKES, s + 47);
  const outro = pickRandom(OUTROS, s + 71);

  let fullSentence = '';
  const isFinish = cat === 'FINISH';
  const isStart = cat === 'START';

  if (isStart) {
    fullSentence = `${hook} ${alias} đã ${action}, quyết tâm giật cúp ${funnyStake} ${outro}`;
  } else if (isFinish) {
    fullSentence = `${hook} ${alias} đã chính thức ${action} ${funnyStake} ${profile.shoutout} ${outro}`;
  } else {
    fullSentence = `${hook} ${alias} vừa có pha ${action}, hình như là ${funnyStake} ${outro}`;
  }

  if (options.speedKmh && options.speedKmh > 350) {
    const roundedSpeed = Math.round(options.speedKmh);
    if (pseudoRandom(s + 99) > 0.4) {
      fullSentence = fullSentence.replace(
        action,
        `${action} ở vận tốc kinh hoàng ${roundedSpeed} km/h`
      );
    }
  }

  const wordCount = fullSentence.split(' ').length;
  const durationSec = Math.max(5.5, Math.min(14.0, Number((wordCount * 0.38).toFixed(2))));

  return {
    id: `dyn_${cat}_${s.toString(36)}`,
    category: cat,
    driverName: profile.name,
    text: fullSentence,
    durationSec,
    intensity: isFinish || cat === 'NITRO' ? 'MAXIMUM' : cat === 'COLLISION' ? 'HIGH' : 'NORMAL'
  };
}

/**
 * Tạo kịch bản diễn biến bình luận trọn vẹn cho từng video xuất xưởng
 */
export function generateFullRaceCommentaryTimeline(
  instanceId: number,
  seed: number = 632585,
  durationSeconds: number = 120
): ScheduledTimelineEvent[] {
  const timeline: ScheduledTimelineEvent[] = [];
  const dur = Math.max(15, durationSeconds);
  const instSeed = seed ^ (instanceId * 7919);

  const driverKeys = Object.keys(DRIVER_PROFILES);
  const mainDriverIndex = (Math.abs(instanceId - 1) + Math.abs(seed % 3)) % driverKeys.length;
  const mainDriver = driverKeys[mainDriverIndex];

  const rivalDriverIndex = (mainDriverIndex + 1 + Math.abs(seed % 5)) % driverKeys.length;
  const rivalDriver = driverKeys[rivalDriverIndex];

  // 1. Mở màn (START)
  const startEvent = generateDynamicCommentary({
    category: 'START',
    driverName: mainDriver,
    seed: instSeed + 101,
    instanceId
  });
  timeline.push({
    clipId: startEvent.id,
    type: 'START',
    driver: startEvent.driverName,
    text: startEvent.text,
    startSec: 1.0,
    durationSec: startEvent.durationSec
  });

  let currentCursorSec = 1.0 + startEvent.durationSec + 3.5;

  // 2. So kè sớm
  if (dur >= 25 && currentCursorSec < dur - 18) {
    const battleEvent = generateDynamicCommentary({
      category: pseudoRandom(instSeed + 203) > 0.5 ? 'BATTLE' : 'SLIPSTREAM',
      driverName: mainDriver,
      targetDriver: rivalDriver,
      seed: instSeed + 203,
      instanceId,
      speedKmh: 480 + Math.round(pseudoRandom(instSeed + 204) * 80)
    });
    timeline.push({
      clipId: battleEvent.id,
      type: battleEvent.category,
      driver: battleEvent.driverName,
      text: battleEvent.text,
      startSec: currentCursorSec,
      durationSec: battleEvent.durationSec
    });
    currentCursorSec += battleEvent.durationSec + 3.5;
  }

  // 3. Tăng tốc Nitro
  if (dur >= 38 && currentCursorSec < dur - 20) {
    const nitroEvent = generateDynamicCommentary({
      category: 'NITRO',
      driverName: mainDriver,
      seed: instSeed + 307,
      instanceId,
      speedKmh: 560 + Math.round(pseudoRandom(instSeed + 308) * 80)
    });
    timeline.push({
      clipId: nitroEvent.id,
      type: 'NITRO',
      driver: nitroEvent.driverName,
      text: nitroEvent.text,
      startSec: currentCursorSec,
      durationSec: nitroEvent.durationSec
    });
    currentCursorSec += nitroEvent.durationSec + 3.5;
  }

  // 4. Ôm cua Drift
  if (dur >= 55 && currentCursorSec < dur - 22) {
    const driftEvent = generateDynamicCommentary({
      category: 'DRIFT',
      driverName: rivalDriver,
      seed: instSeed + 409,
      instanceId,
      speedKmh: 430 + Math.round(pseudoRandom(instSeed + 410) * 50)
    });
    timeline.push({
      clipId: driftEvent.id,
      type: 'DRIFT',
      driver: driftEvent.driverName,
      text: driftEvent.text,
      startSec: currentCursorSec,
      durationSec: driftEvent.durationSec
    });
    currentCursorSec += driftEvent.durationSec + 3.5;
  }

  // 5. Vượt mặt tạt đầu
  if (dur >= 75 && currentCursorSec < dur - 18) {
    const overtakeEvent = generateDynamicCommentary({
      category: 'OVERTAKE',
      driverName: mainDriver,
      targetDriver: rivalDriver,
      seed: instSeed + 521,
      instanceId,
      speedKmh: 590 + Math.round(pseudoRandom(instSeed + 522) * 60)
    });
    timeline.push({
      clipId: overtakeEvent.id,
      type: 'OVERTAKE',
      driver: overtakeEvent.driverName,
      text: overtakeEvent.text,
      startSec: currentCursorSec,
      durationSec: overtakeEvent.durationSec
    });
    currentCursorSec += overtakeEvent.durationSec + 3.5;
  }

  // 6. Cán đích
  const finishEvent = generateDynamicCommentary({
    category: 'FINISH',
    driverName: mainDriver,
    seed: instSeed + 631,
    instanceId,
    speedKmh: 610 + Math.round(pseudoRandom(instSeed + 632) * 40)
  });

  const finishStartSec = Math.max(currentCursorSec, dur - finishEvent.durationSec - 1.2);
  if (finishStartSec < dur) {
    timeline.push({
      clipId: finishEvent.id,
      type: 'FINISH',
      driver: finishEvent.driverName,
      text: finishEvent.text,
      startSec: finishStartSec,
      durationSec: finishEvent.durationSec
    });
  }

  return timeline;
}

/**
 * Phát âm thanh trực tiếp qua Web Speech Synthesis (TTS tiếng Việt năng động)
 */
export function speakCommentaryTTS(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.15; // Tốc độ nhanh thể thao F1
    utterance.pitch = 1.08; // Âm sắc hào hứng, phấn khích

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.name.includes('Vietnamese') || v.lang.includes('VN'));
    if (viVoice) {
      utterance.voice = viVoice;
      utterance.lang = 'vi-VN';
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
    if (onEnd) onEnd();
  }
}
