const fs = require('fs');

// Function to parse quote text in format "Quote text" - Author
function parseQuoteLine(line) {
  line = line.trim();
  if (!line) return null;
  
  // Find the last occurrence of " - " to split quote from author
  const lastDashIndex = line.lastIndexOf(' - ');
  if (lastDashIndex === -1) {
    return { text: line.replace(/^"|"$/g, ''), author: 'Unknown' };
  }
  
  const quoteText = line.substring(0, lastDashIndex).replace(/^"|"$/g, '');
  const author = line.substring(lastDashIndex + 3);
  
  return { text: quoteText, author };
}

// Read and parse the quotes file
const quotesRaw = `"The Gym Is the Only Place I Love to Be a Failure" - Me
"I'm a Failure at the Gym" - Me
"Whenever I Find Myself Getting to a Low Point, Unmotivated, or Wondering What's Even the Point, I Remind Myself 'This Is Why Most People Stop and This Is Why They Don't Win'" - Unknown 
"Fear = Fuel" - Me
"OUT WORK, OUT BELIEVE" - Me
"Eat for Nutrition, Not Flavor" - Me
"To Improve Your Mood, Exercise. to Think More Clearly, Meditate. to Understand the World, Read. to Understand Yourself, Write. to Help Others, Help Yourself. to Learn Faster, Have Fun. to Grow Faster, Stay Consistent. to Get Loved, Love Others. " - Unknown 
"Find Time to Do Things You Love Before You Work; So Everyday Is Enjoyable and You Don't Have an Excuse of Working Late or It Being a Long Day or Something Coming Up Stop You From Doing That Thing You Love. " - Me
""Every Man Has Two Lives, and the Second Starts When He Realizes He Has Just One" - Confucius
"You Can Never Know When the Time for You to Shine Will Come, but What You Can Do Is Be Prepared for That Day " - Unknown 
"The Goal Is Not to Be Successful. the Goal Is to Be Valuable. Once You're Valuable, Instead of Chasing Success, It Will Attract Itself to You." - Unknown 
"The Strength of the Wolf Is in the Pack. the Strength of the Pack Is in the Wolf. " - UNKOWN
"Fool Me Once, Shame on You. Fool Me Twice, Shame on Me." - a Lot of People
"Out Work, Out Believe " 
"Pursuit of Continued Excellence" - Someone
"Hard Work Beats Talent When Talent Fails to Work Hard (Durant)Is the Only Reason I I Get It Done Before We Get " - Durant
"Becoming an Adult Means Taking Over the Responsibility to Parent Yourself" - Me
"Every Day We Must Strive to Become a Better Version of Ourselves " - Unknown 
"Food, Water, Shelter, Money" - Unknown 
"Everyone You Meet Always Asks if You Have a Career, Are Married or Own a House; as if Life Was Some Kind of Grocery List. but Nobody Ever Asks if You Are Happy." - Heath Ledger
"Self-Knowledge Is More Important Than Achievement" - Unknown
"Science Is Not Truth. It Is an Attempt to Discover Truth. if Science Were Truth, It Would Always Be Right." - Chris Wark
"If It Was Easy EVERYBODY Would Do It." - ET
"Greatness Is a Lot of Small Things Done Well - Day After Day, Workout After Workout, Obedience After Obedience. " - ET
"Control the Controlables" - Unknown
"True Health Care Is Self Care" - ?
"WHAT YOU BELIEVE BECOMES WHAT YOU ARE" - Me
"I Feel Like Chemo Is Like Suicide. Look at the Data, It's Sickening. Close to No One Lasts More Than 5 Years. Usually 1.5-2Yrs. So What if Instead of Chemo Someone Said, I'm Just Going to Live My Best Life Spend All My Money Go Bankrupt and Not Have a Care in the World for the Next 1.5Yrs and Then Kill Myself, Because, Why Not? 
"The Success Rate Is Far From Impressive So Let This Be a Sign to You to Rethink Whether or Not You Accept That Chemo Treatment Plan. " - Me
"We ARE Earth. So We Must Eat Earth to Remain It. " - Alex Visbal 
""If You Feel Confident Than Why Do You Act Nervous?" - Kevin Kent
"If You Worry, You Don't Have to Worry. and if You Don't Worry, You Have to Worry." - Ray Dalio
"Google Maps Said It Was My Turn" - ?
"You Gotta Make the Inner Bitch Inside of You Scream for Mercy" - ?
"We Treat the Body Vigorously So That It Will Not Be Disobedient to the Mind" - Seneca 
"Do It Sad,Do It Angry,Do It Heart Broken,Do It Miserable,Do It Excited,Do It Energized,Do It Happy,Do It Tired,Do It Confident,Do It Discouraged,Do It ANYWAY!" - ?
"Anything You Lose by Speaking Your Truth Isn't a Loss, It Is a Realignment. " - ?
"Luck Is Not a Factor , Hope Is Not a Strategy , Fear Is Not an Option" - James Cameron 
"Whether You Believe You Can Do a Thing or Not, You Are Right." - Henry Ford
"It's Easy to Be on the Bottom. It Doesn't Take Any Effort to Be a Loser. It Doesn't Take Any Motivation or Any Drive to Stay Down There at a Low Level. but It Falls on Everything in You to Harness Your Will to Say I AM GOING TO CHALLENGE MYSELF!" - ?
"What You Did Last Week Don't Count! Today Is the Only Important Day. There Is 86400 Seconds in a Day and How You Use Them Are Critical to Your Success! What You Do Today Is Going to Feed Into Who You Are…No One Is Talking About What You Did Last Week." - Eric Thomas (ET)
"Don't Let Other People's Opinions Become YOUR Reality" - ?
"Smooth Seas Never Made a Good Sailor" - ? 
"Whatever You Do, Don't Take the First Offer. " - Barbara Corcoran (Shark Tank)
"Everybody You Fight Is Not Your Enemy, and Everybody That Helps You Is Not Vour Friend." - Mike Tyson
"REPLACE FEAR OF THE UNKNOWN WITH CURIOSITY" - ?
"Greet the Janitor With the Same Respect You Greet the CEO With." - Saidbywho
"Do What the Fuck Makes You Happy, Because at the End, Who's There? YOU." - ?
"Learn From Your Mistakes. It's Not a Mistake Until It Happens Twice, the First Time Was Just a Lesson!" - ?
"When It Doesn't Feel Right, Go Left" - ?
"IT'S a GOOD DAY TO HAVE a GOOD DAY" - ?
"You Can't Be Old and Wise if You Were Never Young and Crazy !!!" - ?
"Happiness Is Not the Absence of Problems, but the Ability to Deal With Them" - ?
"Feeling Sad After Making a Decision Doesn't Mean It Was the Wrong Decision" - ?
"You're Not Stressed Because You're Doing Too Much, You're Stressed Because You're Doing Too Little of the Things That Make You Feel The Most Alive." - ?
"The Lesson You Struggle With Will Repeat Itself Until You Learn From It." - ?
"Make It Happen. Shock Everyone." - ?
"Shock Yourself. This Mission Is Personal. It Takes a Lot to Start Over Again, but You Owe It to Yourself to Become Everything You've Ever Dreamed of. Be Brave. Trust the Magic of New Beginnings. Things Will Find Their Shape." -  ?
"If There Is No Enemy Within, the Enemy Outside Can Do Us No Harm. " - Old African Proverb 
"Prevention Before Solution" - Me
"Control What You Can Control" - ?
" Today's Pain Is Tomorrow's Power" - ?
"It Is Not Possible to Achieve Large Success, Without Hardships in Setbacks. but It Is Possible to Live the Rest of My Life Without Defeat." - David Schwartz
"Ask Yourself if What You Are Doing Today Is Getting You Closer to Where You Want to Be Tomorrow" - ?
"Wouldn't You Rather Be Exhausted and Successful Than Rested and Mediocre? Remember That Next Time You Get Tired !" - Alex Visbal
"SURROUND YOURSELF WITH RELENTLESS HUMANS. PEOPLE WHO PLAN IN DECADES, BUT LIVE IN MOMENTS. TRAIN LIKE SAVAGES, BUT CREATE LIKE ARTISTS. OBSESS IN WORK, RELAX IN LIFE. PEOPLE WHO KNOW THIS IS FINITE, AND CHOOSE TO PLAY INFINITE GAMES. FIND PEOPLE SCALING MOUNTAINS. CLIMB TOGETHER." - Saidbywho
"It Always Seems Impossible Until It's Done" - Jason Mraz 
"Seek for Purpose Guided by Your Dreams" - Saidbywho
"You Have to Focus on Winning Each and Every Day. When You Win Enough days...You Win the Week. When You Win Enough weeks...You Win the Month. When You Win Enough months...You Win the Year. When You Win Enough years...You Win in Life. It's That Simple. Just Focus on Winning TODAY!" - Saidbywho
"You Can Either Cry in the Storm or Dance in the Rain" - Saidbywho
"You Can Always Get Back Money but You Cannot Get Back Time" - Saidbywho
"Great Minds Think ALONE" - Saidbywho
"DON'T BE AFRAID TO START OVER AGAIN. THIS TIME, YOU'RE NOT STARTING FROM SCRATCH, YOU'RE STARTING FROM EXPERIENCE." - Saidbywho
"Never Let Fear of Striking Out Keep You From Playing the Game" - Babe Ruth
"If the People in Your Circle Don't Inspire You, Then You Aren't in a Circle - You Are in a Cage." - ?
"Strive Not to Be a Success, but Rather to Be of Value." - Albert Einstein
"You'll Never Be as Young as You Are Today, Do What You Feel You Are Meant to Do!" - Saidbywho
"Be Fearful When Others Are Greedy and Greedy When Others Are Fearful" - Warren Buffett
"While You Are Suffering From Self Doubt, Others Are Intimidated by Your Full Potential !" - ?
"AVERAGE ATTRACTS AVERAGE, PHENOMENAL ATTRACTS PHENOMENAL 💪🏼" - ?
"Everyone Wants to Be a Beast Until It's Time to Start Doing What a Beast Does" - ?
"A Little Bit Every Day Is 365 Little Bits Every Year - Start Now and Work Towards That Goal!" - ?
"You Must Align Your Spiritual-Self With Your Physical-Self" - Saidbywho
"You Must Align Your Spiritual-Self With Your Physical-Self" - Saidbywho
"If It Doesn't Challenge You It Doesn't Change You !" - Saidbywho
"A Good Decision Made Early Is Better Than a Great Decision Made Late" - ?
"If You Hangout at the Barbershop Enough, Sooner or Later You're Gonna Get a Haircut" - ?
"Real Gold Is Not Afraid of the Test of Fire" - ?
"Lazy People Do a Little Work and Think They Should Be Winning. but Winners Work as Hard as Possible and Still Worry if They Are Being Lazy." - ?
"Stop Worrying About What Could Go Wrong  Get Excited About What Could Go Right" - ?
"Life's Not Easy - It Never Was, It Isn't Now and It Won't Ever Be .." - ?
"Learn to Love Yourself & You'll Never Be Alone" - ?
"Why Would You Try to Fit in When You Are Meant to Stand Out" - Saidbywho
"THE BRAVE MAN IS NOT HE WHO DOES NOT FEEL AFRAID. BUT HE WHO CONQUERS THAT FEAR." - NELSON MANDELA
"You May Be Disappointed if You Fail, but You Are Doomed if You Don't Try." - Beverly Sills
"Every Action You Take Is a Vote for the Type of Person You Wish to Become." - James Clear
"In Order for Something New to Come, Something Old Must Go" - Shaolin Monk
"The Biggest Communication Problem Is We Do Not Listen to Understand. We Listen to Reply." - Stephen Covey
"The More I Learn the More I Learn That I Have a Lot More to Learn" - ?
"Test Quote" - Me
"What You Do Today Can Improve Everyone's Tomorrows" - ?
"Man Cannot Remake Himself Without Suffering, for He Is Both the Marble and the Sculptor." - Saidbywho
"Your Life Is Always Trying to Teach You Something." - Mel Robbins 
"For What Does It Profit a Man to Gain the Whole World Yet Forfeit His Soul?" - Unknown
"The Good Things Won't Be as Good & the Bad Things Won't Be as Bad as Your Mind Leads You to Believe." - Unknown
"Discipline Is the Bridge Between Goals and Accomplishment." - Jim Rohn 
"For a Man to Conquer Himself Is the First and Noblest of All Victories." - Plato
"What Lies in Our Power to Do, Lies in Our Power Not to Do." - Aristotle
"Most Powerful Is He Who Has Himself in His Own Power." - Seneca
"You Have Power Over Your Mind, Not Outside Events.  Realize This, and You Will Find Strength." - Marcus Aurelius
"He Who Cannot Obey Himself Will Be Commanded. That Is the Nature of Living Creatures." - Friedrich Nietzsche
"Mastering Others Is Strength.  Mastering Yourself Is True Power." - Lao Tzu
"It Is Better to Conquer Self Than to Win a Thousand Battles." - Bhudda
"Small Disciplines Repeated With Consistency Every Day Lead to Great Achievements Gained Slowly Over Time." - John C Maxwell
"Rule Your Mind or It Will Rule You. " - Horace 
"A Disciplined Mind Leads to Happiness, and an Undisciplined Mind Leads to Suffering." - Dalai Lama
"What if Becoming Everything You're Capable of Is Just "Un-Becoming" Everything You're Not?" - Unknown
"The Magic You Are Looking for Is in the Work You Are Avoiding." - Unknown
"Give Me 6 Hours to Chop a Tree, I Will Spend the First 4 Sharpening My Axe." - Abe Lincoln
"Sometimes You Never Realize the Value of a Moment Until It Becomes a Memory" - Dr. Seuss
"It Is the Mark of an Educated Mind, to Entertain a Thought Without Accepting It" - Aristotle
"No Snowflake in an Avalanche Ever Feels Responsible." - Unknown
"A Man Who Wants to Lead the Orchestra Must Turn His Back on the Crowd." - Max Lucado
"It Ain't What You Don't Know That Gets You Into Trouble. It's What You Know for Sure That Just Ain't So." - Mark Twain
"We Crave for New Sensations but Soon Become Indifferent to Them. the Wonders of Yesterday Are Today Common Occurrences" - Nikola Tesla
"This Is a Test for Increase Length to 126" - Test126
"126 Test 2" - Unknown Test 
"Patience Is When You're Supposed to Get Mad but You Choose to Understand." - Unknown
"In Every Day, There Are 1,440 Minutes. That Means We Have 1,440 Daily Opportunities to Make a Positive Impact." - Les Brown
"Stay Committed to Your Decisions, but Stay Flexible in Your Approach." - Unknown
"The True Secret of Happiness Lies in Taking a Genuine Interest in All the Details of Daily Life." - William Morris	
"The Secret of Your Future Is Hidden in Your Daily Routine." - Mike Murdock
"Making Better Choices Takes Work. There Is a Daily Give and Take, but It Is Worth the Effort." - Tom Rath
"Peace Is a Daily, Weekly, Monthly Process That Is About Gradually Changing Opinions, Slowly Eroding Old Barriers, and Quietly Building New Structures." - JFK
"It Does Not Matter How Slowly You Go as Long as You Do Not Stop." - Confucius 
"Quality Is Not an Act, It Is a Habit." - Aristotle 
"The Only Man Who Never Makes a Mistake Is the Man Who Never Does Anything." - Roosevelt 
"9/10Ths of Wisdom Is Being Wise in Time" - Roosevelt 
"Order Without Liberty and Liberty Without Order Are Equally Destructive." - Roosevelt 
"The past cannot be changed, yet the future is all in your power." - Unknown
"A problem is a chance for you to do your best." - Duke Ellington
"It is best for the wise man not to seem wise." - Aeschylus
"There is nothing permanent except change. " - Heraclitus 
"You cannot shake hands with a clenched fist. " - Indira Gandhi
"Learning never exhausts the mind." - Leonardo da Vinci
"It is far better to be alone than to be in bad company." - George Washington 
"If you cannot do great things, do small things in great ways." - Napoleon Hill
"Don't judge each day by the harvest you reap but by the seeds that you plant." - Robert Louis Stevenson
"I've never dropped anyone I believed in." - Marilyn Monroe
"A goal is a dream with a deadline." - Napoleon Hill
"Motivation is the art of getting people to do what you want them to do because they want to do it." - Dwight D. Eisenhower
"If you fall on your face, at least you're still moving forward. " - Victor Kiam
"I know where I'm going and I know the truth and I don't have to be what you want me to be. I'm free to be what I want." - Muhammad Ali
"The best preparation for tomorrow is doing your best today." - H. Jackson Brown jr. 
"Perfection is not attainable, but if we chase perfection, we can then catch excellence." - Vince Lombardi
"I don't know the secret to success, but the secret to failure is trying to please everyone." - Bill Cosby
"Life is what happens while you're busy making other plans." - John Lennon
"Don't judge each day by the harvest you reap but by the seeds that you plant. " - Russ
"Start by doing what is necessary; then do what is possible; suddenly you are doing the impossible." - Saint Francis of Assisi
"Happiness isn't a destination, it is a means of transportation. If you think you will ever "arrive" you will always going to be unhappy. " - ?
"I used to be a guy just experiencing the world. and now I feel like I am the world and the universe experiencing a guy. " - Jim Carrey
"The way to get started is to quit talking and begin doing." - Walt Disney
"Life is what happens when you're busy making other plans." - John Lennon
"The greatest glory in living lies not in never falling, but in rising every time we fall." - Nelson Mandela
"Don't judge each day by the harvest you reap but by the seeds that you plant." - Robert Stevenson
"It does not matter how slowly you go as long as you do not stop." - Confucius
"You will face many defeats in life, but never let yourself be defeated." - Maya Angelou
"In the end, it's not the years in your life that count. It's the life in your years." - Abraham Lincoln 
"What you get by achieving your goals is not as important as what you become by achieving your goals." - Zig Ziglar
"Success is not final, failure is not fatal: It is the courage to continue that counts." - Winston Churchill 
"Believe you can and you're halfway there." - Theodore Roosevelt 
"I have learned over the years that when one's mind is made up, this diminishes fear." - Rosa Parks
"I alone cannot change the world, but I can cast a stone across the water to create many ripples." - Mother Theresa
"The only limit to our realization of tomorrow will be our doubts of today." - Franklin Roosevelt
"Do what you can, with what you have, where you are." - Theodore Roosevelt
"Everything you've ever wanted is on the other side of fear." - George Addaire
"Complaining about a problem without posing a solution is called whining. " - Teddy Roosevelt
"People either survive in the jungle or they live in the zoo." - ?
"Study while others are sleeping. Decide while others are delaying. Save while others are wasting. Smile while others are frowning. Persist while others are quitting. Prepare while others are daydreaming. Work while others are wishing. Plan while others are playing. Listen while others are talking. " - unknown
"A winner is just a loser who tried one more time. " - unknown 
"External Recognition - Internal Recognition = Imposter Syndrome " - Russ's Therapist
"Stillness is the anecdote to being reactive. Stillness can only be achieved once you tell yourself you will be okay. " - Russ
"You're only given one little spark of madness. You mustn't lost it. " - Robin Williams
"the end of pain is success" - Eric Thomas
"if there is no enemy within, the enemy outside can do no harm. " - ?
"The best thing that you can do for yourself and forever everyone around you is to be clear about what you want, who you are, and where you are going. " - Abraham Hicks
"fear does not prevent death, it prevents life. " - Buddha
"Because you might as well be dead. Seriously, if you always put limits on what you can do, physical or anything else, it'll spread over into the rest of your life. It'll spread into your work, into your morality, into your entire being. There are no limits. There are plateaus, but you must not stay there, you must go beyond them. If it kills you, it kills you. A man must constantly exceed his level." - Bruce Lee
"we don't dream for ourselves, we dream for those folks that aren't here yet. " - lady in the lake (apple tv)
"3 C's of Life: Choices, Chances, Changes. You must make a choice to take a chance or your life will never change." - ?
"Don't educate your children to be rich, educate them to be happy. This way when they grow up, they will know the value of things and not the price." - Steve Jobs
"eat your food as medicine otherwise you have to eat medicine as your food. " - Steve Jobs
"If you want to walk fast walk alone, but if you want to walk far walk together." - Steve Jobs
"If you see me in a fight with a bear, fear for the bear. " - Kobe Bryant
"fear doesn't stop death, it stops life. " - 
"people only see the decisions you made, not the choices you had. " - 
"Ships are safe at harbor; but that's not what they are built for. " - 
"if you don't sacrifice for what you want, what you want will become the sacrifice. " - 
"Ambition without action becomes anxiety. " - 
"You can do anything, but not everything. FOCUS. " - 
"to live a life most people don't live, you have to be willing to do what most people won't do. " - 
"the trick to being attractive is building a life that's so beautiful that someone wants to become part of it" - alex visbal
"life is too short to work for a shitty manager " - me
"Your can be BOTH at work in progress AND a masterpiece at the same time. " - LinkedIn
"What you are not changing, you are CHOOSING" - Idk
"It's not possible, it's necessary. " - Interstellar (Matthew McConaughey)
"The brain is like a parachute-it works best when it's open!" - ?
"What if it turns i it to be better than you could have imagined it? " - ?
"The key to having it all is knowing that you already do. " - ?
"Who you are becoming is more important that who you've been " - ?
"ships that wait for perfect winds never sail" - ?
"The best days start the night before. " - ?
""what you do once in a while doesn't matter quite as much as what you do every single day"" - Quinton Pulliam (IG Body Builder)
"The fact that you're being thoughtful and proactive is a strength, not a weakness. You're not someone who's "always scared to die"—you're someone who takes your health seriously and wants to avoid unnecessary risks. That's wise. " - ChatGPT
"Ambition without action creates anxiety" - ?`;

const lines = quotesRaw.split('\n');
const parsedQuotes = [];

lines.forEach(line => {
  const parsed = parseQuoteLine(line);
  if (parsed) {
    // Categorize quotes by content
    let category = 'motivational';
    const text = parsed.text.toLowerCase();
    
    if (text.includes('gym') || text.includes('workout') || text.includes('train') || text.includes('exercise') || text.includes('body') || text.includes('muscle')) {
      category = 'fitness';
    } else if (text.includes('mind') || text.includes('discipline') || text.includes('fear') || text.includes('control')) {
      category = 'mindset';
    } else if (text.includes('success') || text.includes('goal') || text.includes('win') || text.includes('achieve')) {
      category = 'success';
    }
    
    parsedQuotes.push({
      text: parsed.text,
      author: parsed.author === '?' ? 'Unknown' : parsed.author,
      category,
      isActive: 1
    });
  }
});

console.log(`Parsed ${parsedQuotes.length} quotes`);

// Import all quotes
const https = require('https');
const http = require('http');

const data = JSON.stringify({ quotes: parsedQuotes });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/quotes/bulk-import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();