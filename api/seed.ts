import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

// 1. Raw CSV Data
// Format: Unit,Brand,Dept,ChineseName,EnglishName,Prize
const csvData = `
ReSources,SSC,羅文妮,Winnie Lo,SAMPO氣炸烤箱 KZ-RA13B
ReSources,SSC,徐麗馨,Lisa Hsu,新光三越3000禮券
ReSources,SSC,林曉伶,Peggy Lin,PHILIPS溫控護髮吹風機 HP8232
ReSources,SSC,林俊佐,Josh Lin,新光三越3000禮券
ReSources,SSC,柯玟伶,Esther Ke,新光三越3000禮券
ReSources,SSC,李桂甄,Jane Lee,新光三越3000禮券
ReSources,SSC,盧曉薇,Silvia Lu,新光三越3000禮券
ReSources,SSC,陳俊維,Jimny Chen,新光三越3000禮券
ReSources,SSC,李翔銨,Emma Lee,新光三越3000禮券
ReSources,SSC,廖若雅,Chris Liao,新光三越3000禮券
ReSources,SSC,游佰祥,Bob Yu,新光三越3000禮券
ReSources,SSC,招詠苓,Candice Chao,新光三越3000禮券
Prodigious,PD,王穎娜,Tina Wang,新光三越3000禮券
LEO,CR,楊乃菁,Jin Yang,新光三越3000禮券
LEO,CR,張居平,Willy Chang,新光三越3000禮券
LEO,CR,王思偉,Andrew Wang,新光三越3000禮券
LEO,CS,沈婉菁,Ruby Shen,新光三越3000禮券
LEO,CR,白永源,White Pai,新光三越3000禮券
LEO,CR,沈美榆,Ally Shen,新光三越3000禮券
Prodigious,PD,施慧玲,Ivy Shih,新光三越3000禮券
Prodigious,CR,林旻詩,Nyonyo Lin,新光三越3000禮券
LEO,CR,陳弘益,Simon Chen,新光三越3000禮券
LEO,CR,臧國明,Benjamin Tzang,新光三越3000禮券
LEO,CR,蔡松益,Eki Tsai,新光三越3000禮券
LEO,CR,何佳勳,Kenji Ho,新光三越3000禮券
LEO,CS,陳冠蓉,Mavis Chen,新光三越3000禮券
LEO,CR,吳詩筠,Shihyun Wu,新光三越3000禮券
LEO,CR,何宜芳,Yvonne Ho,新光三越3000禮券
Prodigious,PD,黃國銘,Guo Huang,新光三越3000禮券
Prodigious,PD,龔玲儀,Ashanti Kung,新光三越3000禮券
LEO,PDTV,高建忠,Evans Kao,新光三越3000禮券
Prodigious,INT,黃禔緗,ConnieTH Huang,新光三越3000禮券
LEO,PDTV,張逸懿,Jasmine Chang,新光三越3000禮券
LEO,CS,黃宇潔,Jessica Huang,新光三越3000禮券
LEO,CR,李家豪,Tim Lee,新光三越3000禮券
LEO,CS,陳秀瑜,AnnHY Chen,新光三越3000禮券
LEO,Planning,嵇經緯,William Chi,新光三越3000禮券
LEO,CS,張佳琳,Aille Chang,新光三越3000禮券
LEO,CR,董信余,Herman Tung,LINE FRIENDS聯名 OGAWA U型枕
LEO,CR,陳暐婷,Olivia Chen,新光三越3000禮券
LEO,CS,梁嘉原,Titan Liang,新光三越3000禮券
LEO,CS,洪鈺嘉,Jessie Hung,新光三越3000禮券
LEO,CR,蔡承翰,York Tsai,新光三越3000禮券
LEO,Management,楊榮柏,Kevin Yang,新光三越3000禮券
LEO,CS,金昀樺,Vivian Chin,新光三越3000禮券
LEO,CR,張冰櫻,Christina Chang,新光三越3000禮券
LEO,CR,劉雅薇,Ariel Liu,新光三越3000禮券
LEO,CS,張純珮,Angela Chang,新光三越3000禮券
LEO,CS,江晶晶,Chinchin Chiang,新光三越3000禮券
LEO,Planning,洪培鈞,Roger Hong,新光三越3000禮券
LEO,CR,吳湘琪,Vicky Wu,新光三越3000禮券
LEO,CR,方璽瑋,Chris Fang,新光三越3000禮券
LEO,CR,曾繁皓,Hao Tseng,新光三越3000禮券
LEO,CR,顏維辰,Dexter Yen,新光三越3000禮券
LEO,CR,宋柏嶢,Yao Song,新光三越3000禮券
Prodigious,PD,余佑俐,Uly Yu,新光三越3000禮券
LEO,PDTV,鍾帛江,Pochiang Chung,TOUS戀我白金女性香精90ML
LEO,CS,顏瑋琦,Abby Yen,新光三越3000禮券
LEO,CR,吳明勳,Sean Wu,新光三越3000禮券
LEO,CR,謝炘儒,Arthur Hsieh,新光三越3000禮券
LEO,CS,楊承翰,RyanCH Yang,新光三越3000禮券
LEO,Planning,許雯綺,Kiwin Hsu,新光三越3000禮券
LEO,CS,蔡承澔,Hao Tsai,新光三越3000禮券
LEO,CR,陳勝美,Sengmei Chen,【CookPower 鍋寶】觸控健康氣炸鍋6L
MSL,CS,藍英綸,Jay Lan,新光三越3000禮券
LEO,CS,曹廷筠,Emma Tsao,新光三越3000禮券
LEO,CR,邱德樵,Allen Chiu,新光三越3000禮券
LEO,CS,楊宗晏,Jeff Yang,新光三越3000禮券
LEO,CS,王叢瑞,RayTJ Wang,新光三越3000禮券
LEO,Planning,林宜瑾,Coral Lin,新光三越3000禮券
LEO,CS,王柏偉,Ryan Wang,新光三越3000禮券
Prodigious,PD,鄒小梅,May Tzou,新光三越3000禮券
LEO,CS,簡志瑋,Kart Jian,Apple Homepod mini
LEO,CS,黃品嘉,JoyPC Huang,新光三越3000禮券
LEO,CS,段宜雯,Doris Duan,新光三越3000禮券
MSL,CS,崔人杰,Richard Tsui,新光三越3000禮券
Human Resource,HR,陳詩涵,Connie Chen,新光三越3000禮券
LEO,CR,許素菁,Jenny Hsu,新光三越3000禮券
LEO,CR,蔡學堯,Darren Cai,新光三越3000禮券
LEO,CS,陳盈璇,Xuan Tan,新光三越3000禮券
LEO,CR,張景雯,Wennie Chang,PHILIPS溫控護髮吹風機 HP8232
LEO,CR,黃大衞,DavidDW Huang,新光三越3000禮券
LEO,CR,范姜競文,Penny FanChiang,新光三越3000禮券
LEO,CR,姜林家真,CJ ChiangLin,新光三越3000禮券
Finance,Finance-PC,徐千皓,Ted Hsu,新光三越3000禮券
LEO,CS,王姵琁,Wanda Wang,新光三越3000禮券
LEO,CS,蕭霑鍥,James Hsiao,新光三越3000禮券
LEO,CS,林佳嫻,NicoleCH Lin,新光三越3000禮券
LEO,CR,詹家峻,Lenin Chan,新光三越3000禮券
LEO,CR,杞孟芸,Viva Chi,新光三越3000禮券
LEO,CS,許福澤,Albert Hsu,富力森15L全不鏽鋼多功能氣炸烤箱
MSL,CS,楊子玹,Chloe Yang,新光三越3000禮券
Prodigious,INT,潘塏翔,Justin Pan,新光三越3000禮券
LEO,CS,李貞臻,Jenjen Lee,新光三越3000禮券
LEO,Management,廖婉婷,Nicole Liao,新光三越3000禮券
LEO,CS,陳詣中,Kevin Chen,新光三越3000禮券
LEO,Planning,藍郁婷,Yuting Lan,新光三越3000禮券
LEO,CR,陳囿竹,Eric Chen,新光三越3000禮券
LEO,CR,陳品音,Abin Chen,新光三越3000禮券
LEO,CS,劉香麟,Sherleen Liu,新光三越3000禮券
MSL,CS,朱祐伶,Celia Chu,新光三越3000禮券
LEO,CR,蔡曉萱,Lina Tsai,TOUS粉粉小熊淡香水50ML
LEO,CR,王鼎鈞,Jim Wang,新光三越3000禮券
LEO,CS,劉德鍏,Wiwi Liu,新光三越3000禮券
LEO,CS,陳文豪,EricWH Chen,新光三越3000禮券
LEO,CR,顏韻容,Erika Yan,新光三越3000禮券
LEO,CS,許嘉文,Vivi Hsu,聲寶無線吸塵器-EC-U12URW
LEO,Planning,祝嘉蔚,Kay Chu,新光三越3000禮券
Finance,Finance-PC,陳唯中,Valerie Chen,新光三越3000禮券
LEO,CR,林嘉麒,Eric Lin,新光三越3000禮券
LEO,CS,張紹芳,Jack Chang,新光三越3000禮券
MSL,CS,張雅筑,Caroline Chang,新光三越3000禮券
LEO,CS,吳家宇,Jonathan Wu,新光三越3000禮券
Prodigious,PD,林素玲,Tracy Lin,新光三越3000禮券
LEO,CR,陳莉惠,April Chen,新光三越3000禮券
LEO,CS,高珺琦,Erin Kao,TOUS淘氣小熊寶寶古龍水 100ML
Administration,Admin,李佩儒,Lily Lee,新光三越3000禮券
Administration,Admin,周亞蓁,Erin Chou,新光三越3000禮券
LEO,CR,巫佳蓉,Cecilia Wu,新光三越3000禮券
LEO,CS,謝秉翰,Hans Hsieh,新光三越3000禮券
LEO,CS,葉晧婷,Haoting Yeh,新光三越3000禮券
LEO,Planning,邱萱綾,Lynn Chiu,新光三越3000禮券
Prodigious,PD,戴秀滿,Mandy Tai,新光三越3000禮券
LEO,CS,吳思辰,Loulou Wu,新光三越3000禮券
LEO,CS,黃子豪,Nolan Huang,新光三越3000禮券
LEO,CR,蔡柔安,Zoe Tsai,新光三越3000禮券
LEO,CS,林芳綺,Kelly Lin,新光三越3000禮券
LEO,CS,郭芝穎,Gordon Kuo,新光三越3000禮券
LEO,CR,曾鈺筌,YuChuan Tseng,新光三越3000禮券
Prodigious,PM,張嘉珊,Trista Chang,新光三越3000禮券
LEO,CS,吳志成,Terrence Wu,新光三越3000禮券
Prodigious,CR,張惠婷,Mochi Chang,新光三越3000禮券
LEO,CR,周冠宇,Alfie Chou,新光三越3000禮券
LEO,CR,黃祺軒,Keira Huang,新光三越3000禮券
Human Resource,HR,詹家瑜,Sunny Chan,新光三越3000禮券
LEO,CR,蔡政憲,Matthew Tsai,新光三越3000禮券
LEO,CS,廖苡婷,Yolanda Liao,新光三越3000禮券
LEO,CS,劉柏松,Howard Liu,新光三越3000禮券
LEO,CS,陳泩閎,Shaun Tan,新光三越3000禮券
LEO,Planning,胡譯方,Linna Hu,新光三越3000禮券
LEO,CS,葉庭妤,Lisa Yeh,tokuyo 無線溫感刮刮揉頸枕 TH-523
LEO,CR,任立軒,Jeff Jen,新光三越3000禮券
LEO,CR,呂閩蕙,HelenMH Lu,新光三越3000禮券
LEO,CS,陳宛靚,Rita Chen,新光三越3000禮券
LEO,CS,蔡博鈞,Lenard Tsai,新光三越3000禮券
LEO,CR,周紫儀,Alice Zhou,新光三越3000禮券
LEO,CR,李聖泓,Hank Lee,新光三越3000禮券
LEO,CS,洪婕菡,Christine Hong,新光三越3000禮券
LEO,CS,劉子瑄,Catherine Liu,新光三越3000禮券
LEO,CS,紀盈齊,Claire Chi,新光三越3000禮券
Human Resource,HR,施舜元,Nick Shih,TOUS淘氣小熊淡香水 90ML*1
LEO,CS,喬宗凡,Van Chiao,新光三越3000禮券
LEO,CS,張思綺,Ella Chang,新光三越3000禮券
Finance,Finance-PC,屈孝瑜,Nini Chu,新光三越3000禮券
LEO,CR,高新雅,Kao Kao,新光三越3000禮券
LEO,CS,張曉鈺,Lilim Chang,新光三越3000禮券
LEO,CR,林政安,Eleven Lin,新光三越3000禮券
LEO,CR,戴芷柔,Kaidon Tai,新光三越3000禮券
LEO,PDTV,黃祖兒,Joey Wong,新光三越3000禮券
LEO,CS,林子匀,Kayla Lin,新光三越3000禮券
LEO,PDTV,彭若琪,Jochi Peng,新光三越3000禮券
LEO,CR,黃璿尹,Eydi Huang,新光三越3000禮券
LEO,CS,容聖閔,Roger Jung,新光三越3000禮券
LEO,CR,張克宇,Matt Chang,新光三越3000禮券
LEO,CS,蔡家蓁,Jenny Tsai,新光三越3000禮券
LEO,CR,蔡逸璇,Joyce Tsai,新光三越3000禮券
LEO,CS,陳冠榕,Ally Chen,新光三越3000禮券
Prodigious,CR,林玉雯,Kimber Lin,新光三越3000禮券
LEO,CR,許晁嘉,Chia Hsu,新光三越3000禮券
LEO,CR,區忠軒,Ken Ou,TOUS戀我白金女性香精90ML
LEO,CS,潘柔彤,Zoey Pan,新光三越3000禮券
LEO,CS,葛家柔,Karen Ke,新光三越3000禮券
LEO,CR,宋家貝,Belle Sung,新光三越3000禮券
LEO,CR,曾昱杰,AJ Tseng,新光三越3000禮券
LEO,CS,孫雅婕,Carol Sun,【KINYO】韓式美型超薄電烤盤36cm
Finance,Finance-PC,張雅涵,AllieYH Chang,新光三越3000禮券
LEO,CR,陳瑋廷,SunnyWT Chen,新光三越3000禮券
LEO,CR,黃向亨,Jonah Huang,【KINYIO】雙温控火烤兩用爐
LEO,CS,陳思樺,Dabby Chen,新光三越3000禮券
Prodigious,PM,張芷馨,CindyCH Chang,新光三越3000禮券
LEO,CS,柯文深,Vincent Ko,新光三越3000禮券
LEO,Planning,巫家慧,Uma Wu,新光三越3000禮券
LEO,CR,洪莉珊,Liz Hung,新光三越3000禮券
LEO,CS,陳靖妤,Liv Chen,新光三越3000禮券
LEO,CS,鄒晞卉,Zena Chou,新光三越3000禮券
Prodigious,INT,張愛,Anna Chang,新光三越3000禮券
LEO,CR,許博淵,Poyuan Hsu,新光三越3000禮券
LEO,CS,柯明秀,Kiki Ke,歌林20L電烤箱 KBO-SD3008
LEO,CS,陳則翔,Tom Chen,新光三越3000禮券
LEO,CS,簡惠羽,Sofi Chien,新光三越3000禮券
Prodigious,INT,林姿彣,Angela Lin,新光三越3000禮券
LEO,CS,張雅琄,Crystal Chang,新光三越3000禮券
LEO,CS,賴姿安,Doria Lai,新光三越3000禮券
LEO,CS,黃宇婕,Katherine Huang,新光三越3000禮券
LEO,CS,李泰錤,TerryTC Li,新光三越3000禮券
LEO,CS,盧品亞,EmilyPY Lu,新光三越3000禮券
LEO,CR,詹育卿,Aching Tsan,新光三越3000禮券
LEO,CR,何佩庭,Rae Ho,新光三越3000禮券
LEO,CR,陳晉豪,Bill Chan,新光三越3000禮券
LEO,CS,梅仲齡,Evelyn Mei,新光三越3000禮券
LEO,CS,陳吟柔,Maeve Chen,新光三越3000禮券
LEO,CS,紀翔升,Johnson Chi,新光三越3000禮券
Prodigious,PM,陳湘鈺,Shan Chen,新光三越3000禮券
LEO,CR,江皓宇,Tim Chiang,北方石墨烯陶瓷遙控電暖器
LEO,CS,徐儀庭,Tiffany Hsu,新光三越3000禮券
LEO,CR,周奕伶,Yiling Chou,新光三越3000禮券
LEO,Planning,黃慧儒,RuHJ Huang,新光三越3000禮券
LEO,CS,張琬渝,Christine Chang,新光三越3000禮券
MSL,CS,江翊菱,Nicole Chiang,新光三越3000禮券
LEO,CR,劉金龍,Nelson Liu,新光三越3000禮券
LEO,CR,王力萱,Abu Wang,新光三越3000禮券
LEO,CS,康曉蓁,Jane Kang,新光三越3000禮券
Finance,Finance-PC,蔡宜家,Wendy Tsai,新光三越3000禮券
LEO,CR,陳翰平,Brian Chen,新光三越3000禮券
LEO,CS,蕭詠青,Angel Hsiao,新光三越3000禮券
LEO,Planning,王嘉澤,Thomas Wang,新光三越3000禮券
LEO,CS,鄭岳洋,Dane Cheng,新光三越3000禮券
MSL,CS,沈家齊,Ivy Shen,新光三越3000禮券
LEO,CR,張慈芸,Mo Chang,新光三越3000禮券
LEO,CS,蔡如恩,Harper Tsai,新光三越3000禮券
LEO,CS,許雪琳,Sharon Hui,新光三越3000禮券
LEO,CS,劉芷吟,Eliza Liu,philips 智能錄音筆
LEO,CR,劉芳瑜,Phoebe Liu,新光三越3000禮券
LEO,CS,黃譯萱,Tiffany Huang,新光三越3000禮券
LEO,CS,簡婉怡,OE Chien,新光三越3000禮券
LEO,CS,胡珈嘉,AbbyCC Hu,新光三越3000禮券
Prodigious,INT,曹慶生,Jonathan Tsao,新光三越3000禮券
LEO,CS,華晉婕,Lauren Hua,新光三越3000禮券
LEO,CS,陳韋捷,Gary Chen,新光三越3000禮券
LEO,CR,邱芷俐,Kelly Chiu,新光三越3000禮券
LEO,CS,呂翊瑄,Ruby Lu,新光三越3000禮券
LEO,CR,紀姿菱,JinaTL Ji,新光三越3000禮券
LEO,CS,陳怜汝,LydiaLJ Chen,新光三越3000禮券
LEO,CR,葉殷如,Ruby Yeh,新光三越3000禮券
LEO,CS,鄒薇均,Vivi Tsou,新光三越3000禮券
Commerical,Director,溫慕垚,Louis Wen,iphone15 pro
Publicis,Creative,高孟杰,Marco Kao,Dyson吹風機
ReSources,SSC,廖昱琦,Lulu Liao,新光三越3000禮券
Prodigious,PD,林明潔,Alice Lin,新光三越3000禮券
Digitas,CS,謝欣妤,Cynthia Hsieh,新光三越3000禮券
Prodigious,PD,張慶陽,Alan Chang,新光三越3000禮券
Prodigious,PD,李美慧,Kiki Lee,新光三越3000禮券
ReSources,SSC,柯欣岑,Oriean Ke,新光三越3000禮券
Prodigious,PD,潘建亨,Jason Pan,新光三越3000禮券
Starcom,Planning,江柏漢,Hans chiang,新光三越3000禮券
Publicis,Planning,鄭丞智,Cheng Cheng,新光三越3000禮券
Prodigious,PD,劉昱賢,Sam Liu,新光三越3000禮券
Prodigious,PM,李明璋,Stan Lee,新光三越3000禮券
Starcom,Planning,蘇靖媗,Gillian Su,新光三越3000禮券
ReSources,SSC,莊千儀,Chian I Chuang,新光三越3000禮券
Starcom,Investment,林湘儀,HsiangYi Lin,新光三越3000禮券
Publicis,CS,陳亭妤,Ting Chen,新光三越3000禮券
Zenith,Planning,李婕瑜,JieYu Lee,新光三越3000禮券
Zenith,Planning,陳思豪,Howard Chen,新光三越3000禮券
ReSources,SSC,王瓊慧,Joanne Wang,新光三越3000禮券
Starcom,Planning,簡子晴,Tsz-Ching Chien,新光三越3000禮券
Human Resource,HR,沈玉梅,May Shen,新光三越3000禮券
Starcom,Planning,張以柔,Zoe Chang,新光三越3000禮券
Starcom,Planning,蘇昱如,Lulu Su,新光三越3000禮券
Prodigious,PD,林欣儀,Shinyi Lin,新光三越3000禮券
Prodigious,PD,李宛蓁,Jane Lee,新光三越3000禮券
Zenith,Planning,張嘉容,Jung Chang,新光三越3000禮券
Starcom,Planning,陳怡璇,Hsuan Chen,新光三越3000禮券
ReSources,SSC,鍾旻倩,Min-Chien Chung,新光三越3000禮券
Zenith,Planning,劉宇軒,Xuan Liu,新光三越3000禮券
Publicis,CS,金百容,PaiJung Chin,新光三越3000禮券
Prodigious,PD,李明杰,Jack Lee,新光三越3000禮券
PMX,Traffic,林淑娟,Shu-Chuan Lin,新光三越3000禮券
Starcom,Planning,吳沛容,Pei-Jung Wu,新光三越3000禮券
Publicis,CS,黃子瑄,Hsuan Huang,新光三越3000禮券
Digitas,CS,葉芳伶,Fang-Ling Yeh,新光三越3000禮券
Starcom,Planning,陳宜婕,Chieh Chen,新光三越3000禮券
Publicis,CS,黃鈺喬,Joe Huang,新光三越3000禮券
Publicis,CS,李宜恬,Yi-Tien Lee,新光三越3000禮券
Growth Intelligence,GI,許家綾,Chialing Hsu,新光三越3000禮券
Starcom,Planning,黃柏叡,Ray Huang,新光三越3000禮券
Publicis,CS,林佑潔,Yu-Chieh Lin,新光三越3000禮券
Zenith,Planning,王俞又,Yuyou Wang,新光三越3000禮券
Zenith,Planning,施博堯,Po-Yao Shih,新光三越3000禮券
Zenith,Planning,李依亭,E-Ting Lee,新光三越3000禮券
Starcom,Planning,黃郁恩,Yu-En Huang,新光三越3000禮券
Starcom,Planning,王郁鈞,Yu-Chun Wang,新光三越3000禮券
Starcom,Planning,張晏寧,Yanning Chang,新光三越3000禮券
Starcom,Planning,陳思宇,Szu-Yu Chen,新光三越3000禮券
Publicis,Creative,楊子萱,Xuan Yang,新光三越3000禮券
Zenith,Planning,王雅鈴,Ya-ling Wang,新光三越3000禮券
ReSources,SSC,莊雅雲,Asa Chuang,新光三越3000禮券
Digitas,CS,李欣樺,Hsin-Hua Li,新光三越3000禮券
Starcom,Planning,王思晴,Sz-Ching Wang,新光三越3000禮券
Digitas,Data,黃少駿,Chun Huang,新光三越3000禮券
ReSources,IT,孫榮鴻,Lung-Hung Sun,新光三越3000禮券
Publicis,Creative,張宇文,Yu-Wen Chang,新光三越3000禮券
Zenith,Planning,林明慧,Ming Lin,新光三越3000禮券
Starcom,Planning,林聖哲,Sheng-Che Lin,新光三越3000禮券
Publicis,CS,張慈芸,Tzu-Yun Chang,新光三越3000禮券
Zenith,Planning,蕭佳容,Chia-Jung Hsiao,新光三越3000禮券
Zenith,Planning,高偉庭,Wei-Ting Kao,新光三越3000禮券
Starcom,Planning,李佳紋,Chia-Wen Lee,新光三越3000禮券
Starcom,Planning,鄭雅方,Ya-Fang Cheng,新光三越3000禮券
Publicis,CS,林佩儀,Pei-Yi Lin,新光三越3000禮券
ReSources,SSC,黃小芬,Hsiao-Fen Huang ,新光三越3000禮券
Zenith,Planning,蔡依珊,Yi-Shan Tsai,新光三越3000禮券
Prodigious,PD,張碧珊,Pi-Shan Chang,新光三越3000禮券
Starcom,Planning,葉人瑋,Jen-Wei Yeh,新光三越3000禮券
ReSources,IT,林永祥,Yung-Hsiang Lin,新光三越3000禮券
Zenith,Planning,陳慧玲,Huei-Ling Chen,新光三越3000禮券
Starcom,Planning,高瑜璟,Yu-Ching Kao,新光三越3000禮券
Starcom,Planning,陳宜青,I-Ching Chen,新光三越3000禮券
Digitas,CS,石佩玉,Pei-Yu Shih,新光三越3000禮券
Digitas,Data,沈志興,Chih-Hsing Shen,新光三越3000禮券
Starcom,Planning,謝佩吟,Pei-Yin Hsieh,新光三越3000禮券
Zenith,Planning,許家瑋,Chia-Wei Hsu,新光三越3000禮券
Starcom,Planning,柯佩儀,Pei-Yi Ko,新光三越3000禮券
Starcom,Planning,李怡慧,Yi-Hui Lee,新光三越3000禮券
ReSources,SSC,王敏華,Min-Hua Wang,新光三越3000禮券
ReSources,IT,吳國良,Kuo-Liang Wu,新光三越3000禮券
Zenith,Planning,徐培鳳,Pei-Feng Hsu,新光三越3000禮券
Zenith,Planning,張庭,Ting Chang,新光三越3000禮券
Publicis,CS,曾柏鈞,Po-Chun Tseng,新光三越3000禮券
Publicis,Strategic Planning,張維珊,Wei-Shan Chang,新光三越3000禮券
ReSources,SSC,游琇惠,Hsiu-Huei Yu,新光三越3000禮券
Publicis,Creative,張千芝,Chien-Chih Chang,新光三越3000禮券
Zenith,Planning,胡惠萍,Huei-Ping Hu,新光三越3000禮券
ReSources,SSC,許淑芬,Shu-Fen Hsu,新光三越3000禮券
ReSources,SSC,謝美玲,Mei-Ling Hsieh,新光三越3000禮券
Starcom,Planning,蔡東霖,Tung-Lin Tsai,新光三越3000禮券
Zenith,Planning,吳佳玲,Chia-Ling Wu,新光三越3000禮券
Collective,Creative,陳俊宇,Chun-Yu Chen,新光三越3000禮券
Starcom,Planning,陳佳微,Chia-Wei Chen,新光三越3000禮券
Performics,Biddable,林佳儀,Chia-Yi Lin,新光三越3000禮券
Starcom,Planning,王韻筑,Yun-Chu Wang,新光三越3000禮券
Starcom,Planning,林芳伃,Fang-Yu Lin,新光三越3000禮券
Performics,SEO,謝文婷,Wen-Ting Hsieh,新光三越3000禮券
Digitas,CS,蔡依芸,Yi-Yun Tsai,新光三越3000禮券
Starcom,Planning,李佳燕,Chia-Yen Lee,新光三越3000禮券
Starcom,Investment,林怡君,Yi-Chun Lin,新光三越3000禮券
Zenith,Planning,曹文馨,Wen-Hsin Tsao,新光三越3000禮券
Starcom,Planning,黃文潔,Wen-Chieh Huang,新光三越3000禮券
Publicis,CS,高詩閔,Shih-Min Kao,新光三越3000禮券
ReSources,SSC,許淑靜,Shu-Ching Hsu,新光三越3000禮券
Digitas,CS,石芳綺,Fang-Chi Shih,新光三越3000禮券
Performics,Biddable,楊千慧,Chien-Hui Yang,新光三越3000禮券
Starcom,Planning,黃淑玲,Shu-Ling Huang,新光三越3000禮券
Starcom,Planning,李佳凌,Chia-Ling Lee,新光三越3000禮券
Starcom,Planning,李惠玲,Huei-Ling Lee,新光三越3000禮券
ReSources,SSC,宋素雲,Su-Yun Sung,新光三越3000禮券
ReSources,SSC,高秀緞,Hsiu-Tuan Kao,新光三越3000禮券
Digitas,CS,張鈴雅,Ling-Ya Chang,新光三越3000禮券
ReSources,SSC,朱惠美,Huei-Mei Chu,新光三越3000禮券
Publicis,Creative,李佳憲,Chia-Hsien Li,新光三越3000禮券
ReSources,SSC,潘淑芬,Shu-Fen Pan,新光三越3000禮券
Starcom,Planning,羅惠瑜,Huei-Yu Lo,新光三越3000禮券
ReSources,SSC,王敏華,Min-Hua Wang,新光三越3000禮券
ReSources,SSC,郭淑華,Shu-Hua Kuo,新光三越3000禮券
ReSources,SSC,周慧琦,Huei-Chi Chou,新光三越3000禮券
Starcom,Planning,戴昱如,Yu-Ju Tai,新光三越3000禮券
Starcom,Planning,郭芳君,Fang-Chun Kuo,新光三越3000禮券
Performics,Biddable,林怡秀,Yi-Hsiu Lin,新光三越3000禮券
Starcom,Planning,林佳樺,Chia-Hua Lin,新光三越3000禮券
Starcom,Planning,沈怡伶,Yi-Ling Shen,新光三越3000禮券
Zenith,Planning,李怡慧,Yi-Huei Lee,新光三越3000禮券
Zenith,Planning,周詩敏,Shih-Min Chou,新光三越3000禮券
ReSources,SSC,江慧玲,Huei-Ling Chiang,新光三越3000禮券
Zenith,Planning,王怡文,Yi-Wen Wang,新光三越3000禮券
Zenith,Planning,陳怡璇,Yi-Hsuan Chen,新光三越3000禮券
ReSources,SSC,謝宜穎,Yi-Ying Hsieh,新光三越3000禮券
Commercial,Commercial,陳慧芬,Huei-Fen Chen,新光三越3000禮券
Starcom,Planning,李宜真,Yi-Chen Lee,新光三越3000禮券
Zenith,Planning,王淑娟,Shu-Chuan Wang,新光三越3000禮券
Starcom,Planning,陳宜君,Yi-Chun Chen,新光三越3000禮券
Publicis,Creative,楊秀萍,Hsiu-Ping Yang,新光三越3000禮券
Starcom,Planning,林怡君,Yi-Chun Lin,新光三越3000禮券
Publicis,CS,林欣怡,Hsin-Yi Lin,新光三越3000禮券
Starcom,Planning,陳慧君,Huei-Chun Chen,新光三越3000禮券
Digitas,CS,蔡怡君,Yi-Chun Tsai,新光三越3000禮券
Starcom,Planning,張雅婷,Ya-Ting Chang,新光三越3000禮券
Starcom,Planning,陳怡君,Yi-Chun Chen,新光三越3000禮券
Performics,Biddable,黃慧貞,Huei-Chen Huang,新光三越3000禮券
Starcom,Planning,許雅婷,Ya-Ting Hsu,新光三越3000禮券
Publicis,CS,陳怡君,Yi-Chun Chen,新光三越3000禮券
Starcom,Planning,林怡Hu君,Yi-Chun Lin,新光三越3000禮券
Digitas,CS,王怡君,Yi-Chun Wang,新光三越3000禮券
Starcom,Planning,陳怡君,Yi-Chun Chen,新光三越3000禮券
Publicis,Strategic Planning,林欣怡,Hsin-Yi Lin,新光三越3000禮券
ReSources,SSC,李怡君,Yi-Chun Lee,新光三越3000禮券
Zenith,Planning,陳怡君,Yi-Chun Chen,新光三越3000禮券
Publicis,CS,李怡君,Yi-Chun Lee,新光三越3000禮券
Zenith,Planning,林欣怡,Hsin-Yi Lin,新光三越3000禮券
Starcom,Planning,陳怡君,Yi-Chun Chen,新光三越3000禮券
Publicis,Strategic Planning,林欣怡,Hsin-Yi Lin,新光三越3000禮券
Starcom,Planning,林欣怡,Hsin-Yi Lin,新光三越3000禮券
Starcom,Planning,陳怡君,Yi-Chun Chen,新光三越3000禮券
`;

export default async function handler(request: Request) {
    try {
        // 2. Create Table
        // Modified schema: english_name is unique key
        await sql`
      CREATE TABLE IF NOT EXISTS prizes (
        english_name VARCHAR(255) PRIMARY KEY,
        chinese_name VARCHAR(255),
        brand VARCHAR(255),
        net_prize VARCHAR(255),
        is_claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // 3. Parse and Insert
        const rows = csvData.trim().split('\n');
        let insertedCount = 0;

        // We only want to process unique english names to prevent duplicate key errors during mass insert
        // though the SQL handles conflict, it's better to be clean.
        const uniqueRows = new Map();

        for (const row of rows) {
            if (!row.trim()) continue;
            const cols = row.split(',').map(s => s.trim());
            if (cols.length < 5) continue;

            // CSV columns from observed data:
            // ReSources,SSC,羅文妮,Winnie Lo,SAMPO氣炸烤箱 KZ-RA13B
            // 0:Unit, 1:Dept/Brand?, 2:ChineseName, 3:EnglishName, 4:Prize

            // Wait, the CSV structure seems to have 5 columns in the example above.
            // Let's verify carefully.
            const brand = cols[0]; // Unit as Brand
            const chineseName = cols[2];
            const englishName = cols[3];
            const prize = cols[4];

            if (!englishName) continue;

            uniqueRows.set(englishName, { brand, chineseName, englishName, prize });
        }

        for (const item of uniqueRows.values()) {
            await sql`
            INSERT INTO prizes (english_name, chinese_name, brand, net_prize)
            VALUES (${item.englishName}, ${item.chineseName}, ${item.brand}, ${item.prize})
            ON CONFLICT (english_name) DO UPDATE SET 
                net_prize = EXCLUDED.net_prize,
                chinese_name = EXCLUDED.chinese_name,
                brand = EXCLUDED.brand;
        `;
            insertedCount++;
        }

        return new Response(JSON.stringify({
            message: 'Database seeded successfully',
            inserted: insertedCount
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
