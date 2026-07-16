const TONES = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
];

const hashTone = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};

const SIZES = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-xl' };

const Avatar = ({ name, size = 'md', tone, className = '' }) => (
  <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0
    ${tone || hashTone(name)} ${SIZES[size]} ${className}`}>
    {name?.trim()?.charAt(0)?.toUpperCase() || '?'}
  </div>
);

export default Avatar;
