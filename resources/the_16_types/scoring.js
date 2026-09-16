/* Shared by the standalone page and Node verification. No fitted persona weights. */
(function (root) {
  'use strict';
  const axes = [
    { id: 'EI', title: 'מאיפה מגיעה האנרגיה', labels: ['מוחצן', 'מופנם'], explanations: ['מפגש עם אנשים ועיבוד בקול', 'מרחב אישי ועיבוד פנימי'] },
    { id: 'SN', title: 'איך קולטים את העולם', labels: ['קונקרטי', 'עיוני'], explanations: ['פרטים מוחשיים וניסיון ישיר', 'דפוסים, רעיונות ואפשרויות'] },
    { id: 'TF', title: 'מה מנחה החלטות', labels: ['שכלתני', 'רגשי'], explanations: ['עקביות, עקרונות ושיקולים ענייניים', 'ערכים אישיים וההשפעה על אנשים'] },
    { id: 'JP', title: 'איך ניגשים לחיי היום-יום', labels: ['גבולני', 'פתוח'], explanations: ['מסגרת, תכנון וסגירת קצוות', 'גמישות, התאמה והשארת אפשרויות'] }
  ];
  const hebrew = { E: 'ח', I: 'מ', S: 'ק', N: 'ע', T: 'ש', F: 'ר', J: 'ג', P: 'פ', X: '?' };
  function score(questions, answers) {
    if (!Array.isArray(answers) || answers.length !== questions.length || Array.from(answers).some(a => !Number.isInteger(a) || a < 1 || a > 5)) {
      throw new Error('יש להשיב על כל השאלות בתשובות בין 1 ל-5');
    }
    const results = axes.map(axis => {
      let sum = 0, count = 0, neutral = 0, first = 0, second = 0;
      questions.forEach((q, i) => {
        if (q.axis !== axis.id) return;
        const value = (3 - answers[i]) * (q.aPole === axis.id[0] ? 1 : -1);
        sum += value; count++;
        if (!value) neutral++; else if (value > 0) first++; else second++;
      });
      if (!count) throw new Error('Missing axis: ' + axis.id);
      const normalized = sum / (count * 2);
      const firstPercent = Math.round(50 + 50 * normalized);
      return { ...axis, sum, count, neutral, first, second, normalized, firstPercent,
        secondPercent: 100 - firstPercent, letter: sum === 0 ? 'X' : sum > 0 ? axis.id[0] : axis.id[1],
        close: Math.abs(normalized) <= 0.25,
        label: sum === 0 ? 'ללא העדפה מכריעה' : Math.abs(normalized) <= 0.25 ? 'נטייה קלה' : Math.abs(normalized) <= 0.6 ? 'נטייה בינונית' : 'נטייה בולטת' };
    });
    const code = results.map(a => a.letter).join('');
    const candidates = results.reduce((codes, a) => codes.flatMap(c => (a.close ? [...a.id] : [a.letter]).map(l => c + l)), ['']);
    candidates.sort((a, b) => distance(a) - distance(b) || a.localeCompare(b));
    function distance(type) { return results.reduce((total, axis, i) => total + (1 - (type[i] === axis.id[0] ? 1 : -1) * axis.normalized), 0); }
    return { code, hebrewCode: [...code].map(c => hebrew[c]).join(''), axes: results, candidates,
      neutralCount: answers.filter(a => a === 3).length,
      straightLine: new Set(answers).size === 1 };
  }
  const api = { axes, hebrew, score };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MBTI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
