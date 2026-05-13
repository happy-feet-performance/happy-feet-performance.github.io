/* ============================================================
   HappyFeet — scripture.js
   Daily rotating scripture from a pool of 30
   Changes each day, consistent across all roles
   ============================================================ */

const HF_SCRIPTURE = (() => {

  const SCRIPTURES = [
    { verse: '"I can do all things through Christ who strengthens me."',                                ref: 'Philippians 4:13' },
    { verse: '"For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you."', ref: 'Jeremiah 29:11' },
    { verse: '"Have I not commanded you? Be strong and courageous. Do not be afraid."',                ref: 'Joshua 1:9' },
    { verse: '"Whatever you do, work at it with all your heart, as working for the Lord."',            ref: 'Colossians 3:23' },
    { verse: '"He gives strength to the weary and increases the power of the weak."',                  ref: 'Isaiah 40:29' },
    { verse: '"Those who hope in the LORD will renew their strength. They will soar on wings like eagles."', ref: 'Isaiah 40:31' },
    { verse: '"Be strong and courageous. Do not be discouraged, for the LORD your God will be with you."', ref: 'Joshua 1:9' },
    { verse: '"Commit to the LORD whatever you do, and he will establish your plans."',                ref: 'Proverbs 16:3' },
    { verse: '"The LORD is my strength and my shield; my heart trusts in him, and he helps me."',      ref: 'Psalm 28:7' },
    { verse: '"Do not be anxious about anything, but in every situation, present your requests to God."', ref: 'Philippians 4:6' },
    { verse: '"Trust in the LORD with all your heart and lean not on your own understanding."',         ref: 'Proverbs 3:5' },
    { verse: '"Let us not become weary in doing good, for at the proper time we will reap a harvest."', ref: 'Galatians 6:9' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble."',                     ref: 'Psalm 46:1' },
    { verse: '"Be still, and know that I am God."',                                                    ref: 'Psalm 46:10' },
    { verse: '"The LORD your God is with you, the Mighty Warrior who saves."',                         ref: 'Zephaniah 3:17' },
    { verse: '"No weapon formed against you shall prosper."',                                          ref: 'Isaiah 54:17' },
    { verse: '"Whoever wants to become great among you must be your servant."',                        ref: 'Matthew 20:26' },
    { verse: '"Love is patient, love is kind. It does not envy, it does not boast."',                  ref: '1 Corinthians 13:4' },
    { verse: '"I praise you because I am fearfully and wonderfully made."',                            ref: 'Psalm 139:14' },
    { verse: '"The heart of man plans his way, but the LORD establishes his steps."',                  ref: 'Proverbs 16:9' },
    { verse: '"For we walk by faith, not by sight."',                                                  ref: '2 Corinthians 5:7' },
    { verse: '"With God all things are possible."',                                                    ref: 'Matthew 19:26' },
    { verse: '"Cast all your anxiety on him because he cares for you."',                               ref: '1 Peter 5:7' },
    { verse: '"The LORD will fight for you; you need only to be still."',                              ref: 'Exodus 14:14' },
    { verse: '"I sought the LORD, and he answered me; he delivered me from all my fears."',            ref: 'Psalm 34:4' },
    { verse: '"You are the light of the world. A town built on a hill cannot be hidden."',             ref: 'Matthew 5:14' },
    { verse: '"Run in such a way as to get the prize."',                                               ref: '1 Corinthians 9:24' },
    { verse: '"Be watchful, stand firm in the faith, act like men, be strong."',                       ref: '1 Corinthians 16:13' },
    { verse: '"The LORD bless you and keep you; the LORD make his face shine on you."',                ref: 'Numbers 6:24-25' },
    { verse: '"Blessed is the one who perseveres under trial."',                                       ref: 'James 1:12' },
  ];

  const getToday = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    return SCRIPTURES[dayOfYear % SCRIPTURES.length];
  };

  const stripHTML = () => {
    const s = getToday();
    return `
      <div class="scripture-strip" style="margin-bottom:var(--sp-xl);padding:var(--sp-lg)">
        <i class="ti ti-cross" style="color:var(--faith);font-size:18px;flex-shrink:0"></i>
        <span>${s.verse} <em style="color:var(--faith);font-style:normal;font-weight:600">~ ${s.ref}</em></span>
      </div>`;
  };

  return { getToday, stripHTML };

})();

window.HF_SCRIPTURE = HF_SCRIPTURE;