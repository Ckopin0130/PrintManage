// 檔案位置: src/initialData.js

// --- 1. 客戶資料 ---
export const FULL_IMPORT_DATA = [
  // --- 屏東區 ---
  { customerID: 'pt001', name: '東陽汽車', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮船頭路25-165號', phones: [{ label: '電話', number: '0975132161' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'pt002', name: '台慶房屋', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮光復路一段289號', phones: [{ label: '電話', number: '08-8335000' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt003', name: '台灣房屋', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮光復路一段250號', phones: [{ label: '電話', number: '08-8338811' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt004', name: '鳳家房屋', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮船頭路25-248號', phones: [{ label: '電話', number: '08-8333373' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt005', name: '安華房屋', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮明德一路409號', phones: [{ label: '電話', number: '08-8355666' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt006', name: '首席不動產', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮興東一街231號', phones: [{ label: '電話', number: '08-8325777' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'pt007', name: '弘盟汽車修護', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮興東里沿海路80號', phones: [{ label: '電話', number: '08-8330311' }], assets: [{ model: 'MP 3010' }], serviceCount: 0 },
  { customerID: 'pt008', name: '佑城房屋', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮新興三街166號', phones: [{ label: '電話', number: '08-8310095' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt009', name: '東港衛生所', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮船頭路5-1號', phones: [{ label: '電話', number: '08-8325310' }], assets: [{ model: 'MP C3503' }], serviceCount: 0 },
  { customerID: 'pt010', name: '宏福氣體', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮東新里大利路3段112-3號', phones: [{ label: '電話', number: '08-8646399' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt011', name: '東港郭代書', L1_group: '屏東區', L2_district: '東港鎮', address: '屏東縣東港鎮中正路29號', phones: [{ label: '郭麗勤', number: '0927451135' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  
  // 新園鄉
  { customerID: 'pt012', name: '理全', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉烏龍村弘農路51號', phones: [{ label: '電話', number: '08-8323847' }], assets: [{ model: 'MP C3504' }], serviceCount: 0 },
  { customerID: 'pt013', name: '禾一精機', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉港西村興安路15巷56號', phones: [{ label: '電話', number: '0922101701' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'pt014', name: '東新不動產', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉塩洲路79號', phones: [{ label: '電話', number: '08-8332776' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt015', name: '金原', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉仙吉路223-1號', phones: [{ label: '電話', number: '08-8683759' }], assets: [{ model: 'MP 3010' }], serviceCount: 0 },
  { customerID: 'pt016', name: '馨園家教（仙吉）', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉仙吉村仙隆路49巷46號', phones: [{ label: '許小姐', number: '0919868421' }], assets: [{ model: 'MP C5502' }], serviceCount: 0 },
  { customerID: 'pt017', name: '馨園家教（國小旁）', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉新園村媽祖路51號', phones: [{ label: '電話', number: '08-8683500' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  { customerID: 'pt018', name: '銓盛營造公司', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉興龍村臥龍路165號', phones: [{ label: '陳淯正先生', number: '0921208427' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'pt019', name: '鉑凱機械公司', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉興龍村臥龍路567-12號', phones: [{ label: '電話', number: '08-8330668' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'pt020', name: '德晉實業', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉五房村五房路906號', phones: [{ label: '電話', number: '08-8691234' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'pt021', name: '黃老師補習班', L1_group: '屏東區', L2_district: '新園鄉', address: '屏東縣新園鄉西平路76-1號', phones: [{ label: '黃宏閔', number: '0912781133' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },

  // 萬丹鄉
  { customerID: 'pt022', name: '馨園家教（新莊）', L1_group: '屏東區', L2_district: '萬丹鄉', address: '屏東縣萬丹鄉新鍾村新鍾路197號', phones: [{ label: '電話', number: '0932809550' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'pt023', name: '士鴻營造', L1_group: '屏東區', L2_district: '萬丹鄉', address: '屏東縣萬丹鄉萬興街2巷13號1樓', phones: [{ label: '電話', number: '08-7770094' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt024', name: '扶輪社', L1_group: '屏東區', L2_district: '萬丹鄉', address: '屏東縣萬丹鄉專寮村榮華路43巷5號', phones: [{ label: '黃麗蘭', number: '0987133776' }], assets: [{ model: 'MP 3010' }], serviceCount: 0 },

  // 屏東市
  { customerID: 'pt025', name: '程震文理補習班', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市新興里3巷48號', phones: [{ label: '葉小姐/程先生', number: '0926683165' }], assets: [{ model: 'MP 3000' }], serviceCount: 0 },
  { customerID: 'pt026', name: '莊代書', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市新興街6巷2號', phones: [{ label: '電話', number: '0915788558' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt027', name: '藍庭光律師事務所', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市棒球路36號', phones: [{ label: '電話', number: '08-7550738' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt028', name: '尖兵保全', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市民生路12-16號', phones: [{ label: '黃先生', number: '08-7231496' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'pt029', name: '李華森律師事務所', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市中山路279號', phones: [{ label: '謝先生', number: '08-7667986' }], assets: [{ model: 'MP C3504' }], serviceCount: 0 },
  { customerID: 'pt030', name: '富達國際旅行社', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市勝利路129號', phones: [{ label: '電話', number: '08-7340099' }], assets: [{ model: 'MP 3502' }], serviceCount: 0 },
  { customerID: 'pt031', name: '永權股份有限公司', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市瑞光里民生東路58-1號', phones: [{ label: '電話', number: '08-7231925' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  { customerID: 'pt032', name: '宋孟陽律師事務所', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市建南路154號', phones: [{ label: '電話', number: '08-7510062' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt033', name: '微米飯店', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市復興路25號9樓', phones: [{ label: '電話', number: '08-7343456' }], assets: [{ model: 'MP C3504' }], serviceCount: 0 },
  { customerID: 'pt034', name: '聖化建設', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市中山路258號', phones: [{ label: '電話', number: '0929115242' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt035', name: '萬吉建設', L1_group: '屏東區', L2_district: '屏東市', address: '屏東縣屏東市中山路258號', phones: [{ label: '林小姐', number: '087229888' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },

  // 長治鄉
  { customerID: 'pt036', name: '長治鄉衛生所', L1_group: '屏東區', L2_district: '長治鄉', address: '屏東縣長治鄉進興村潭頭路3號', phones: [{ label: '電話', number: '08-7368734' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  // 鹽埔鄉
  { customerID: 'pt037', name: '阿貴叔叔（補習班）', L1_group: '屏東區', L2_district: '鹽埔鄉', address: '屏東縣鹽埔鄉鹽南村民權路15-20號', phones: [{ label: '電話', number: '0918327362' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  { customerID: 'pt038', name: '名冠美語', L1_group: '屏東區', L2_district: '鹽埔鄉', address: '屏東縣鹽埔鄉新二村維新路109-2號', phones: [{ label: '許小姐', number: '0976511998' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  // 竹田鄉
  { customerID: 'pt039', name: '立傑補習班', L1_group: '屏東區', L2_district: '竹田鄉', address: '屏東縣竹田鄉自強路41-16號', phones: [{ label: '李小姐', number: '0939597851' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  // 三地門鄉
  { customerID: 'pt040', name: '原苗幼兒園', L1_group: '屏東區', L2_district: '三地門鄉', address: '屏東縣三地門鄉三地村29巷35號', phones: [{ label: '電話', number: '08-7992210' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  // 林邊鄉
  { customerID: 'pt041', name: '正傳補習班', L1_group: '屏東區', L2_district: '林邊鄉', address: '屏東縣林邊鄉仁愛路84-1號', addressNote: '家用地址: 東港鎮新興2街22巷4號', phones: [{ label: '電話', number: '0929800805' }], assets: [{ model: 'MP 3350B' }], serviceCount: 0 },
  { customerID: 'pt042', name: '陽明代書', L1_group: '屏東區', L2_district: '林邊鄉', address: '屏東縣林邊鄉榮農路5巷10-5號', phones: [{ label: '葉小姐', number: '0932747824' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt043', name: '仁和幼兒園', L1_group: '屏東區', L2_district: '林邊鄉', address: '屏東縣林邊鄉仁和村中山路291-1號', phones: [{ label: '電話', number: '08-8753052' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  // 潮州鎮
  { customerID: 'pt044', name: '侑展營造公司', L1_group: '屏東區', L2_district: '潮州鎮', address: '屏東縣潮州鎮四維路422號', phones: [{ label: '電話', number: '08-7835137' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  // 萬巒鄉
  { customerID: 'pt045', name: '沈代書', L1_group: '屏東區', L2_district: '萬巒鄉', address: '屏東縣萬巒鄉萬巒村中正路32-2號', phones: [{ label: '電話', number: '08-7812982' }], assets: [{ model: 'MP 3350' }], serviceCount: 0 },
  // 南州鄉
  { customerID: 'pt046', name: '新發氣體公司', L1_group: '屏東區', L2_district: '南州鄉', address: '屏東縣南州鄉米崙村成功路15號', phones: [{ label: '電話', number: '08-8642316' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'pt047', name: '順茂貨運公司', L1_group: '屏東區', L2_district: '南州鄉', address: '屏東縣南州鄉勝利路12-7號', phones: [{ label: '電話', number: '08-8647252' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  // 麟洛鄉
  { customerID: 'pt048', name: '萬吉建設', L1_group: '屏東區', L2_district: '麟洛鄉', address: '屏東縣麟洛鄉民生路8號', phones: [{ label: '林先生', number: '0980862361' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  // 里港鄉
  { customerID: 'pt049', name: '大田海洋食品公司', L1_group: '屏東區', L2_district: '里港鄉', address: '屏東縣里港鄉中和路33-1號', phones: [{ label: '電話', number: '08-7733558' }], assets: [{ model: 'MP 3504ex' }], serviceCount: 0 },

  // --- 高雄區 ---
  { customerID: 'kh001', name: '開廣林園公司', L1_group: '高雄區', L2_district: '林園區', address: '高雄市林園區清水岩路149巷11號', phones: [{ label: '電話', number: '07-6437273' }], assets: [{ model: 'MP 3350B' }], serviceCount: 0 },
  { customerID: 'kh002', name: '高墾', L1_group: '高雄區', L2_district: '三民區', address: '高雄市三民區南華路245號-2F', phones: [{ label: '電話', number: '07-2850226' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'kh003', name: '左營供應站', L1_group: '高雄區', L2_district: '左營區', address: '高雄市左營區實踐路46號', phones: [{ label: '電話', number: '07-5878746' }], assets: [{ model: '未設定' }], serviceCount: 0 },
  { customerID: 'kh004', name: '南區辦公室', L1_group: '高雄區', L2_district: '左營區', address: '高雄市左營區實踐路46號', phones: [{ label: '電話', number: '07-5871948' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'kh005', name: '鳳山供應站（福利站）', L1_group: '高雄區', L2_district: '鳳山區', address: '高雄市鳳山區勝利路11號', phones: [{ label: '電話', number: '07-7017951' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'kh006', name: '鳳協市場', L1_group: '高雄區', L2_district: '鳳山區', address: '高雄市鳳山區勝利路9巷', phones: [{ label: '電話', number: '07-7027853' }], assets: [{ model: 'MP C3503' }], serviceCount: 0 },
  { customerID: 'kh007', name: '勝威保全', L1_group: '高雄區', L2_district: '鳳山區', address: '高雄市鳳山區建國路一段35號', phones: [{ label: '電話', number: '07-7023130' }], assets: [{ model: 'MP C3503' }], serviceCount: 0 },
  { customerID: 'kh008', name: '皇家保全', L1_group: '高雄區', L2_district: '苓雅區', address: '高雄市苓雅區和平一路87號-3樓-1', phones: [{ label: '電話', number: '07-7135305' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'kh009', name: '震合興汽車修護', L1_group: '高雄區', L2_district: '苓雅區', address: '高雄市苓雅區英祥街17號', phones: [{ label: '歐先生', number: '07-7132555' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'kh010', name: '高雄郭代書', L1_group: '高雄區', L2_district: '苓雅區', address: '高雄市苓雅區尚義街13號', phones: [{ label: '郭麗勤', number: '0927451135' }], assets: [{ model: '未設定' }], serviceCount: 0 },
  { customerID: 'kh011', name: '皇郡建設', L1_group: '高雄區', L2_district: '新興區', address: '高雄市新興區新田路117號', phones: [{ label: '電話', number: '07-2163338' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },

  // --- 學校單位 ---
  // 新園國中
  { customerID: 'sch001', name: '新園國中-學務處', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'A棟一樓第一間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  { customerID: 'sch002', name: '新園國中-教務處', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'A棟一樓後中間 (已換新機C5000)', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  { customerID: 'sch003', name: '新園國中-輔導室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'A棟一樓後面', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 2550B' }], serviceCount: 0 },
  { customerID: 'sch004', name: '新園國中-專任辦公室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'A棟二樓第一間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3350' }], serviceCount: 0 },
  { customerID: 'sch005', name: '新園國中-會計室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'A棟二樓中間那邊', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3350' }], serviceCount: 0 },
  { customerID: 'sch006', name: '新園國中-七導室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'A棟三樓第一間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 2550' }], serviceCount: 0 },
  { customerID: 'sch007', name: '新園國中-九導室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'B棟一樓第一間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3350' }], serviceCount: 0 },
  { customerID: 'sch008', name: '新園國中-校長室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'B棟二樓第一間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'sch009', name: '新園國中-八導室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'B棟二樓中間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3350' }], serviceCount: 0 },
  { customerID: 'sch010', name: '新園國中-人事室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'B棟三樓第一間', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'sch011', name: '新園國中-總務室', L1_group: '學校單位', L2_district: '新園國中', address: '屏東縣新園鄉仙吉村仙吉路111號', addressNote: 'C棟', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 5000' }], serviceCount: 0 },
  // 港西國小
  { customerID: 'sch012', name: '港西國小-總務處', L1_group: '學校單位', L2_district: '港西國小', address: '屏東縣新園鄉中和路101號', phones: [{ label: '電話', number: '08-8681644' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  // 新埤國中
  { customerID: 'sch013', name: '新埤國中-總務處', L1_group: '學校單位', L2_district: '新埤國中', address: '屏東縣新埤鄉建功路190號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'sch014', name: '新埤國中-導師室', L1_group: '學校單位', L2_district: '新埤國中', address: '屏東縣新埤鄉建功路190號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'sch015', name: '新埤國中-教導室', L1_group: '學校單位', L2_district: '新埤國中', address: '屏東縣新埤鄉建功路190號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  // 霧台國小
  { customerID: 'sch016', name: '霧台國小-總務處', L1_group: '學校單位', L2_district: '霧台國小', address: '屏東縣長治鄉文化街200號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  { customerID: 'sch017', name: '霧台國小-校長室', L1_group: '學校單位', L2_district: '霧台國小', address: '屏東縣長治鄉文化街200號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },
  // 中崙國中
  { customerID: 'sch018', name: '中崙國中-總務處', L1_group: '學校單位', L2_district: '中崙國中', address: '高雄市鳳山區中崙二路397號', addressNote: '左棟一樓', phones: [{ label: '電話', number: '07-7538686' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'sch019', name: '中崙國中-教務處', L1_group: '學校單位', L2_district: '中崙國中', address: '高雄市鳳山區中崙二路397號', addressNote: '左棟二樓', phones: [{ label: '電話', number: '07-7538686' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'sch020', name: '中崙國中-學務處', L1_group: '學校單位', L2_district: '中崙國中', address: '高雄市鳳山區中崙二路397號', addressNote: '右棟一樓', phones: [{ label: '電話', number: '07-7538686' }], assets: [{ model: 'MP C3502' }], serviceCount: 0 },
  { customerID: 'sch021', name: '中崙國中-教導處', L1_group: '學校單位', L2_district: '中崙國中', address: '高雄市鳳山區中崙二路397號', addressNote: '右棟二樓中間', phones: [{ label: '電話', number: '07-7538686' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'sch022', name: '中崙國中-輔導室', L1_group: '學校單位', L2_district: '中崙國中', address: '高雄市鳳山區中崙二路397號', addressNote: '右棟三樓', phones: [{ label: '電話', number: '07-7538686' }], assets: [{ model: 'MP C5000' }], serviceCount: 0 },

  // --- 軍事單位 ---
  // 金湯營區
  { customerID: 'mil001', name: '步訓部194營站', L1_group: '軍事單位', L2_district: '金湯營區', address: '高雄市鳳山區鳳頂路1000號', notes: '下次攜帶備用碳粉備用', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  { customerID: 'mil002', name: '步訓部總務處文卷室', L1_group: '軍事單位', L2_district: '金湯營區', address: '高雄市鳳山區鳳頂路1000號', notes: '送發票要簽名', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C3504ex' }], serviceCount: 0 },
  { customerID: 'mil003', name: '步訓部學員1大隊', L1_group: '軍事單位', L2_district: '金湯營區', address: '高雄市鳳山區鳳頂路1000號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'C830' }], serviceCount: 0 },
  { customerID: 'mil004', name: '步訓部學員2大隊', L1_group: '軍事單位', L2_district: '金湯營區', address: '高雄市鳳山區鳳頂路1000號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'DP3050' }], serviceCount: 0 },
  { customerID: 'mil005', name: '步訓部機步第１營', L1_group: '軍事單位', L2_district: '金湯營區', address: '高雄市鳳山區鳳頂路1000號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 3352' }], serviceCount: 0 },
  // 泰山營區
  { customerID: 'mil006', name: '八軍團保防組', L1_group: '軍事單位', L2_district: '泰山營區', address: '高雄市旗山區泰山路1號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C3503' }], serviceCount: 0 },
  { customerID: 'mil007', name: '八軍團法治室', L1_group: '軍事單位', L2_district: '泰山營區', address: '高雄市旗山區泰山路1號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C3503' }], serviceCount: 0 },
  { customerID: 'mil008', name: '八軍團營站', L1_group: '軍事單位', L2_district: '泰山營區', address: '高雄市旗山區泰山路1號', phones: [{ label: '電話', number: '' }], assets: [{ model: '噴墨印表機' }], serviceCount: 0 },
  { customerID: 'mil009', name: '四支部主計科', L1_group: '軍事單位', L2_district: '泰山營區', address: '高雄市旗山區泰山路1號', notes: '已由永信接管', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP 5503' }], serviceCount: 0 },
  { customerID: 'mil010', name: '四支部萊子坑彈藥分庫辦公室', L1_group: '軍事單位', L2_district: '泰山營區', address: '高雄市旗山區泰山路1號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'C830/MPC3503' }], serviceCount: 0 },
  // 嶺口營區
  { customerID: 'mil011', name: '四支部運輸兵群二級場', L1_group: '軍事單位', L2_district: '嶺口營區', address: '高雄市旗山區旗南三路234號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'C830' }], serviceCount: 0 },
  { customerID: 'mil012', name: '四支部運輸兵群1營1連辦公室', L1_group: '軍事單位', L2_district: '嶺口營區', address: '高雄市旗山區旗南三路234號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'DP3050' }], serviceCount: 0 },
  { customerID: 'mil013', name: '陸軍特指部特三營值日室', L1_group: '軍事單位', L2_district: '嶺口營區', address: '高雄市旗山區旗南三路234號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP C5503' }], serviceCount: 0 },
  { customerID: 'mil014', name: '陸軍特指部特三營聯合辦公室', L1_group: '軍事單位', L2_district: '嶺口營區', address: '高雄市旗山區旗南三路234號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'C830' }], serviceCount: 0 },
  { customerID: 'mil015', name: '陸軍特指部特三營預財辦公室', L1_group: '軍事單位', L2_district: '嶺口營區', address: '高雄市旗山區旗南三路234號', notes: '碳粉統一在資訊室', phones: [{ label: '電話', number: '' }], assets: [{ model: 'DP3050' }], serviceCount: 0 },
  { customerID: 'mil016', name: '陸軍特指部特三營資訊辦公室', L1_group: '軍事單位', L2_district: '嶺口營區', address: '高雄市旗山區旗南三路234號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'DP3050' }], serviceCount: 0 },
  // 涼山營區
  { customerID: 'mil017', name: '特勤隊辦公室', L1_group: '軍事單位', L2_district: '涼山營區', address: '屏東縣內埔鄉新發路300號', phones: [{ label: '電話', number: '' }], assets: [{ model: 'C831' }], serviceCount: 0 },
  { customerID: 'mil018', name: '特勤隊值日室', L1_group: '軍事單位', L2_district: '涼山營區', address: '屏東縣內埔鄉新發路300號', notes: '有DP3050兩台已收起來未使用', phones: [{ label: '電話', number: '' }], assets: [{ model: 'MP3352' }], serviceCount: 0 },
];

// --- 2. 模擬維修紀錄 ---
export const MOCK_RECORDS = [
  {
    id: 'r001', customerID: 'pt012', date: '2023-10-15', status: 'completed',
    fault: '卡紙 - 定影部', symptom: '定影部頻繁卡紙',
    solution: '更換定影上爪，清潔分離爪', action: '更換定影上爪，清潔分離爪',
    parts: [{ id: 1, name: '定影上爪', qty: 5 }], photoBefore: null, photoAfter: null
  },
  {
    id: 'r002', customerID: 'pt001', date: new Date().toISOString().split('T')[0], status: 'pending',
    fault: '黑線/黑帶', symptom: '列印出全黑線條',
    solution: '檢測為鼓組刮刀老化，待料更換', action: '檢測為鼓組刮刀老化，待料更換',
    parts: [], photoBefore: null, photoAfter: null
  }
];

// --- 3. 預設車載庫存 ---
export const INITIAL_INVENTORY = [
  // 通用/耗材
  { id: 'p7', name: '搓紙輪', model: '共用耗材', qty: 20, max: 20, unit: '個' },
  { id: 'p8', name: '廢碳粉瓶', model: '共用耗材', qty: 3, max: 3, unit: '個' },
  // MPC 系列
  { id: 'p1', name: '定影上爪', model: 'MPC 3003/3503', qty: 10, max: 10, unit: '個' },
  { id: 'p2', name: '定影下爪', model: 'MPC 3003/3503', qty: 10, max: 10, unit: '個' },
  { id: 'p3', name: '感光鼓', model: 'MPC 3003/3503', qty: 2, max: 3, unit: '支' },
  { id: 'p4', name: '清潔刮刀', model: 'MPC 3003/3503', qty: 5, max: 5, unit: '支' },
  // IM 系列
  { id: 'p5', name: '黑色碳粉 (K)', model: 'IM C4500/6000', qty: 2, max: 4, unit: '支' },
  { id: 'p6', name: '感光鼓單元 (PCDU)', model: 'IM C4500/6000', qty: 1, max: 2, unit: '組' },
];