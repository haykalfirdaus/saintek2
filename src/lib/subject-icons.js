import {
  Atom,
  FlaskConical,
  Microscope,
  Calculator,
  Languages,
  BookOpen,
  Globe2,
  Landmark,
  Cpu,
  Dumbbell,
  Palette,
  Music,
  Sprout,
  Moon,
  Scale,
  BookMarked,
} from 'lucide-react'

/*
  Map a schedule subject string (free text from the DB) to a fancy icon.
  Matching is lowercase substring so "Fisika Peminatan" still hits "fisika".
  Falls back to BookOpen for anything unknown.
*/
const RULES = [
  [['fisika'], Atom],
  [['kimia'], FlaskConical],
  [['biologi', 'biology'], Microscope],
  [['matematika', 'mtk', 'math'], Calculator],
  [['inggris', 'english'], Languages],
  [['indonesia', 'b. indo', 'bahasa indo'], BookOpen],
  [['arab'], BookMarked],
  [['geografi'], Globe2],
  [['sejarah', 'history'], Landmark],
  [['ekonomi'], Scale],
  [['sosiologi', 'pkn', 'ppkn', 'kewarganegaraan'], Scale],
  [['informatika', 'tik', 'komputer', 'coding'], Cpu],
  [['penjas', 'olahraga', 'pjok'], Dumbbell],
  [['seni', 'budaya', 'rupa'], Palette],
  [['musik'], Music],
  [['prakarya', 'kewirausahaan'], Sprout],
  [['agama', 'pai', 'akidah', 'akhlak', 'fikih', 'fiqih', 'quran', "qur'an", 'hadis', 'ski'], Moon],
]

export function subjectIcon(name = '') {
  const key = String(name).toLowerCase()
  for (const [needles, Icon] of RULES) {
    if (needles.some((n) => key.includes(n))) return Icon
  }
  return BookOpen
}
