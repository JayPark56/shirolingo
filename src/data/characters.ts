import type { CharacterLine } from '../types'

export const ALL_CHARACTERS: CharacterLine[] = [
  // 포켓몬
  { id: 'charmander',   seriesName: '포켓몬',    characterName: '파이리',    evolutionLabels: ['파이리','리자드','리자몽','메가리자몽'], isRare: false },
  { id: 'bulbasaur',    seriesName: '포켓몬',    characterName: '이상해씨',  evolutionLabels: ['이상해씨','이상해풀','이상해꽃','메가이상해꽃'], isRare: false },
  { id: 'squirtle',     seriesName: '포켓몬',    characterName: '꼬부기',    evolutionLabels: ['꼬부기','어니부기','거북왕','메가거북왕'], isRare: false },
  { id: 'pikachu',      seriesName: '포켓몬',    characterName: '피카츄',    evolutionLabels: ['피카츄','피카츄Z','피카츄파트너','라이츄'], isRare: true },
  // 은혼
  { id: 'gintoki',      seriesName: '은혼',      characterName: '긴토키',    evolutionLabels: ['평복','전투','각성','신령'], isRare: false },
  { id: 'kagura',       seriesName: '은혼',      characterName: '카구라',    evolutionLabels: ['평복','전투','우산개방','최강'], isRare: false },
  { id: 'shinpachi',    seriesName: '은혼',      characterName: '신파치',    evolutionLabels: ['평복','안경각성','결의','전사'], isRare: false },
  { id: 'katsura',      seriesName: '은혼',      characterName: '가츠라',    evolutionLabels: ['평복','수배중','변장','사령관'], isRare: true },
  // 헌터헌터
  { id: 'gon',          seriesName: '헌터헌터',  characterName: '곤',        evolutionLabels: ['소년','수련','각성','성인곤'], isRare: false },
  { id: 'killua',       seriesName: '헌터헌터',  characterName: '키르아',    evolutionLabels: ['평복','암살자','갓스피드','번개해방'], isRare: false },
  { id: 'leorio',       seriesName: '헌터헌터',  characterName: '레오리오',  evolutionLabels: ['정장','분노','의사복','넨펀치'], isRare: false },
  { id: 'kurapika',     seriesName: '헌터헌터',  characterName: '크라피카',  evolutionLabels: ['평복','사슬등장','황제시간','붉은눈'], isRare: true },
  // 하이큐
  { id: 'hinata',       seriesName: '하이큐',    characterName: '히나타',    evolutionLabels: ['신입','각성','도약','리틀자이언트'], isRare: false },
  { id: 'bokuto',       seriesName: '하이큐',    characterName: '보쿠토',    evolutionLabels: ['평소','스파이크','슈퍼모드','무적'], isRare: false },
  { id: 'ushijima',     seriesName: '하이큐',    characterName: '우시지마',  evolutionLabels: ['평소','강력서브','스파이크','압도'], isRare: false },
  { id: 'kageyama',     seriesName: '하이큐',    characterName: '카게야마',  evolutionLabels: ['세터','집중','왕모드','진화세터'], isRare: false },
  // 유유백서
  { id: 'yusuke',       seriesName: '유유백서',  characterName: '유스케',    evolutionLabels: ['교복','영탄환','마인','마족'], isRare: false },
  { id: 'hiei',         seriesName: '유유백서',  characterName: '히에이',    evolutionLabels: ['평복','사안','암룡파','최강'], isRare: false },
  { id: 'kazuma',       seriesName: '유유백서',  characterName: '카즈마',    evolutionLabels: ['평복','바람오라','바람마스터','차원검'], isRare: false },
  { id: 'botan',        seriesName: '유유백서',  characterName: '보탄',      evolutionLabels: ['평복','사신모드','전투복','최강'], isRare: true },
  { id: 'kurama',       seriesName: '유유백서',  characterName: '쿠라마',    evolutionLabels: ['홍발','장미채찍','은발','구미호'], isRare: false },
  // 원피스
  { id: 'luffy',        seriesName: '원피스',    characterName: '루피',      evolutionLabels: ['기어1','기어2','기어4','기어5'], isRare: false },
  { id: 'zoro',         seriesName: '원피스',    characterName: '조로',      evolutionLabels: ['평복','삼도류','귀기','명왕'], isRare: false },
  { id: 'sanji',        seriesName: '원피스',    characterName: '상디',      evolutionLabels: ['평복','킥자세','레이드수트','이프리트'], isRare: false },
  { id: 'shanks',       seriesName: '원피스',    characterName: '샹크스',    evolutionLabels: ['평소','검준비','패왕색','최강'], isRare: true },
  // 짱구
  { id: 'crayon_shin',  seriesName: '짱구',      characterName: '짱구',      evolutionLabels: ['액션가면팬','알몸대시','영웅짱구','어른짱구'], isRare: false },
  { id: 'crayon_maeng', seriesName: '짱구',      characterName: '맹구',      evolutionLabels: ['평소','로봇장난감','발명가','천재맹구'], isRare: false },
  { id: 'crayon_white', seriesName: '짱구',      characterName: '흰둥이',    evolutionLabels: ['강아지','달리기','슈퍼흰둥이','전설흰둥이'], isRare: false },
  { id: 'crayon_chul',  seriesName: '짱구',      characterName: '철수',      evolutionLabels: ['평소','울보모드','용감한철수','엘리트철수'], isRare: false },
  { id: 'crayon_yuri',  seriesName: '짱구',      characterName: '유리',      evolutionLabels: ['평소','공주모드','운동유리','최강유리'], isRare: true },
  // 주술회전
  { id: 'jjk_itadori',  seriesName: '주술회전',  characterName: '이타도리유지', evolutionLabels: ['평복','정권돌파','스쿠나각성','분홍마귀'], isRare: false },
  { id: 'jjk_nanami',   seriesName: '주술회전',  characterName: '나나미',    evolutionLabels: ['정장','전투','붕대해제','최강나나미'], isRare: false },
  { id: 'jjk_gojo',     seriesName: '주술회전',  characterName: '고조사토루', evolutionLabels: ['선글라스','눈가리개','무량공처','최강술사'], isRare: false },
  { id: 'jjk_geto',     seriesName: '주술회전',  characterName: '겟토스구루', evolutionLabels: ['학생','최강술사','타락','최종보스'], isRare: false },
  { id: 'jjk_yuta',     seriesName: '주술회전',  characterName: '옷코츠유타', evolutionLabels: ['겁쟁이','리카소환','검사','진형술사'], isRare: true },
]

export const SERIES_LIST = [...new Set(ALL_CHARACTERS.map(c => c.seriesName))]
