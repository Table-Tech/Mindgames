// Curated list of common 5-letter English words.
// Used both as the pool of possible answers and as the set of accepted guesses.
// Expand later from a larger dictionary if you want stricter guess validation.

const RAW = `
about above abuse actor acute admit adopt adult after again
agent agree ahead alarm album alert alike alive allow alone
along alter among anger angle angry apart apple apply arena
argue arise array aside asset audio audit avoid award aware
awful badly baker bases basic basis beach began begin begun
being below bench billy birth black blame blank blast blaze
blend blind block blood bloom blown bluff blunt board boast
boost booth bound brain brand brass brave bread break breed
brick brief bring broad broke brook brown brush build built
bunch burst buyer cabin cable candy carry catch cause cease
chain chair chalk champ chaos charm chart chase cheap cheat
check chest chief child chill choir chose civic civil claim
clamp clash class clean clear cliff climb cling cloak clock
close cloth cloud clown clued coach coast cobra cocoa colon
color comic comma coral could count court cover crack craft
crane crash crawl crazy cream creek crept crime crisp crook
cross crowd crown crude cruel crunk crush crust cubic curly
curse curve cycle daily dairy dance dated dealt death debit
debut decay delay depot depth devil diary digit dimly dined
diner dirty disco ditch diver dizzy dodge donor doubt dough
dozen draft drain drama drank drawn dread dream dress dried
drill drink drive drone drown drunk dryer duchy dusty dwarf
eager eagle early earth easel eaten ebony edict edify eerie
egret eight elbow elder elect elite email ember empty enact
enemy enjoy enter entry equal error event every exact exile
exist extra fable faint fairy faith false fancy fault favor
feast fence ferry fetch fever fewer fiber field fiery fifth
fifty fight final fiord first fixed fizzy flair flame flank
flash flask fleet flesh flick fling float flock flood floor
flora flour flown fluid flung flush focal focus folly force
forge forte forth forty forum found frame frank fraud freak
fresh fried frill frock front frost frown froze fruit fudge
fully funky funny furry fussy fuzzy gaily gamer gauge gaunt
gauze gavel gawky gazed gecko genie genre ghost giant given
glade glare glass glaze gleam glide glint globe gloom glory
glove gnash gnome going golem grade grain grand grant grape
grasp grass grate grave gravy graze great greed green greet
grief grill grime grimy grind gripe gross group grout grove
growl grown gruff grump grunt guard guess guest guide guile
guilt guppy gusto gypsy habit haiku hairy hairy halve hands
handy happy hardy harem hatch hater haunt haven havoc heady
heard heart heath heave heavy hedge hefty hello hence herbs
hertz hilly hinge hippo hippy hitch hoard hoist hobby holly
homer honey honor horde horse hotel hound hours house human
humid humor hunch hurry husky hyena hymen icily ideal idiom
idler igloo image imbue impel imply inbox incur index inert
infer ingot inlet inner input inter intro ionic iotas irate
irony issue ivory jaded jaunt jeans jelly jerky jewel joker
jolly judge juice juicy jumbo jumpy jungle junky karma kayak
kebab khaki kinky kiosk kitty knack knead kneel knelt knife
knock knoll known koala krill label labor laden lager lapse
large larva laser later laugh layer leach leafy leaky leant
leapt learn lease leash least leave ledge leech leery lefty
legal leggy lemon lemur leper level lever libel light liken
limbo limit linen liner lingo links lipid liver lived lives
livid llama loamy loath lobby local locus lodge lofty logic
loose loser lousy lover lower loyal lucid lucky lumen lumpy
lunar lunch lunge lupus lurch lurid lusty lying lymph lyric
macro madam madly magic magma maker malty mamma mango mangy
manic manor maple march marry marsh mason match matte mayor
maybe mecca medal media medic melon merge merit merry metal
meter metro micro might milky mimic mince mined miner minor
minus mirth mixed mocha modal model modem money month moody
moose moral moron mossy motel motif motor motto moult mound
mount mourn mouse mouth mover movie moxie mucus muddy mulch
mummy munch mural murky mushy music musky muted myrrh nadir
naive nanny nasal nasty natal naval navel needy neigh nerve
never newer newly nicer niche niece night ninja ninny ninth
noble nobly noise noisy nomad nonce north nosey notch noted
novel novice nudge nurse nutty nylon nymph oaken oasis ocean
octal octet often olden older olive ombre omega onion onset
opera opine optic orbit organ ought ounce outdo outer outgo
ovary overt ovoid owing owner oxide ozone paddy pagan paint
paler palms panel panic paper parka parse party pasta paste
patch patio patty pause peace peach pearl pecan pedal penal
pence penny peony perch peril perky pesky pesto petal petty
phase phone photo piano picky piece piety piggy pilot pinch
piney pinky pious pipes pithy pivot pixel pixie pizza place
plain plait plane plank plant plate playa plaza plead pleat
plied plier plumb plume plump plumy plunk plush poach point
poise polar poppy porch posit posse pouch pound pouty power
prank prawn preen press price prick pride pried prime primp
print prior prism prize probe prone prong proof prose proud
prove prune psalm pubic pudgy puffy pulpy pulse punch pupae
pupal puppy puree purge purse pushy putty pygmy quack quail
quake quart quash quasi queen quell query quest queue quick
quiet quill quilt quirk quite quota quote rabid racer radar
radii radio rainy raise rajah rally rancy randy range rapid
rarer rated ratio raven rayon razor reach react ready realm
rearm rebar rebel rebut recap recur reedy refer refit regal
rehab reign relax relay relic remit renal renew repay repel
reply repro reset resin retch retro retry reuse revel revue
rhino rhyme rider ridge rifle right rigid riser risky rival
river rivet roast robin robot rocky rodeo roger rogue roman
romeo roomy roost rotor rouge rough round route rowdy royal
ruddy ruder rugby ruler rumor rural rusty saber sable sadly
safer saint salad sally salon salsa salty salve salvo sandy
sappy saree sassy satin satyr sauce saucy saute savor savoy
sawed scald scale scalp scaly scamp scare scarf scary scene
scent scion scoff scold scone scoop scope score scorn scour
scout scowl scram scrap screw scrub scrum scuba sedan seedy
segue seize semis sense sepia serif serum serve seven sever
sewer shack shade shady shaft shake shaky shale shall shalt
shame shank shape shard share shark sharp shave shawl shear
sheen sheep sheer sheet sheik shelf shell shied shift shine
shiny shire shirk shirt shoal shock shone shook shoot shore
shorn short shout shove shown showy shred shrew shrub shrug
shuck shunt shush shyly siege sieve sight sigma silky silly
since sinew singe siren sissy sixth sixty skate skier skiff
skill skimp skirt skulk skull skunk slack slain slang slant
slash slate slave sleek sleep sleet slept slice slick slide
slime slimy sling slink sloop slope slosh sloth slump slunk
slurp slush small smart smash smear smell smelt smile smirk
smite smith smock smoke smoky smote snack snail snake snaky
snare snarl sneak sneer snide sniff snipe snoop snore snort
snout snowy snuck snuff soapy sober soggy solar solid solve
sonar sonic sooty sorry sound south sower space spade spank
spare spark spasm spawn speak spear speck speed spell spelt
spend spent sperm spice spicy spied spiel spike spiky spill
spilt spine spiny spire spite splat spoil spoke spoof spook
spool spoon spore sport spout spray spree sprig spunk spurn
spurt squad squat squib stack staff stage staid stain stake
stale stalk stall stamp stand stank stare stark start stash
state stave stead steak steal steam steed steel steep steer
stein stern stick stiff still stilt sting stink stint stoic
stoke stole stomp stone stony stood stool stoop store stork
storm story stout stove strap straw stray strip strut stuck
study stuff stump stung stunk stunt style suave sugar suing
suite sulky sully sumac sunny super surer surge surly sushi
swami swamp swarm swash swath swear sweat sweep sweet swell
swept swift swill swine swing swirl swish swoon swoop sword
swore sworn swung synod syrup tacit taken taker tally talon
tamer tango tangy taper tapir tardy tarot taste tasty tatty
taunt tawny teach teary tease teddy teeth tempo tenet tenor
tense tepid terse testy thank theft their theme there these
theta thick thief thigh thing think third thong thorn those
three threw throb throw thrum thumb thump thyme tiara tidal
tiger tight tilde timer timid tipsy titan tithe title toast
today toddy token tonal tonic tooth topaz topic torch torso
torus total totem touch tough towel tower toxic toxin trace
track trade trail train trait trash trawl tread treat trend
triad trial tribe trice trick tried tripe trite troll troop
trope trout trove truce truck truer truly trump trunk truss
trust truth tryst tubal tuber tulip tulle tumor tunic turbo
tutor twang tweak tweed tweet twice twine twirl twist twixt
tying udder ulcer ultra umbra uncle uncut under undid undue
unfed unfit unify union unite unity unlit unmet unset until
unzip upper upset urban urine usage usher using usual usurp
utile utter vague valet valid valor value valve vapid vapor
vault vaunt vegan venom venue verge versa verse very vetch
vicar video vigil vigor villa vinyl viola viper viral virus
visit visor vista vital vivid vixen vocal vodka vogue voice
voila voter vouch vowel vroom vying wacky wafer wager wagon
waist waive waltz warty waste watch water waver waxen weary
weave wedge weedy weigh weird welch welsh whack whale wharf
wheat wheel whelp where which whiff while whine whiny whirl
whisk white whole whoop whose widen wider widow width wield
wight wilds wilds wimpy wince winch windy wines winey wiper
wired wiser wispy witch witty woken woman women wonky woody
wooed wooer woozy world worry worse worst worth would wound
woven wrack wrath wreak wreck wrest wring wrist write wrong
wrote wrung wryly yacht yearn yeast yield young youth zebra
zesty zilch zonal zonky zoned
abide abled abode acing acorn acrid actin adage adapt addle adept
adieu adobe afoot afoul agape agate agile aglow agora aided ailed
aimed aired aisle alder algae alibi alley alloy aloft aloha aloof
aloud altar amass amaze amber amble amend amiss amity ample anime
ankle annal annex annoy anode antic anvil aorta apron arbor arden
arose array ascot ashen askew aspic asses atone attic audio aught
augur aural autos avail avert avian avoid await awake aware awash
awful awoke axial axion azure baddy badge bagel baggy bairn balmy
balsa banal banjo barge baron basal basin baton bayou beach beady
beard beast beech beefy beget begot belch belie belly belts bench
beret berry beset betel bevel bezel bibles biddy biome birch birds
bison bitty black blade blame bleak bleat bleed bleep blend bless
blimp blink bliss bloat block blood bloom blots blown blues bluff
blunt blurt blush board boast bobby boggy boils boldly bones bongo
bonus boozy borne bosom boson boxer brace braid brain brake brand
brash brass brawl brawn bread break bream bribe brick bride brief
briny brisk broad broke brood brook broom broth brown bruin brunt
brush brute buddy bugle build built bulky bully bunch bunny burly
busty butch caddy caged cagey caked caled cameo camps canal candy
caned canna canny canoe canon caped caper caput cards cargo carol
carry carve caste catch cater caulk cause cease cedar cello chafe
chaff chain chair chalk champ chant chaos chaps chard charm chart
chase chasm cheap cheek cheer chess chest chew chick chief child
chili chill chime china chink chips chirp chock choir choke chomp
chord chore chose chuck chuff chump chunk churn chute cider cigar
cinch circa civic civil clack claim clamp clang clank clash class
clean clear cleat cleft clerk click cliff climb cling clink cloak
clock close cloth cloud clout clove clown cluck clued clump clung
coach coast cocoa colon comma comet conch condo coral corny couch
cough could count court cover covet covey cower coyly crack craft
cram crash crate crave crawl craze creak cream creek crepe crept
crews cribs crick crime crimp crisp crock crook crops cross croup
crowd crown crude cruel crumb crush crust crypt cubic cumin curio
curly curry curve cycle dairy daisy dally dance dandy dared darts
dated daunt davit dazed deals dealt decal decay decor decoy decry
deeds defer deign deity delay delta delve demon demos depot depth
derby derma desks detox dewdrop dimes diner dingy dirty disco ditty
divan dived diver divot dixie dizzy dodge doggy doily doing dolls
donor donut dopey dough dowdy dowel downy dowry doyen dozen draft
drain drake drama drank drape drawl drawn dread dream dress dried
drier drill drink drip drive drone drool droop dross drown drugs
drums drunk dryer ducky dudes duets duffel duped durum dusky dwarf
dwell dying eager early earth eased easel eaten ebbed ebook ecard
educe egged eight elbow elder elect elegy elite email embed ember
embers emcee emery empty enact ended endow enemy enjoy ennui enrol
enter entry envoy epoch epoxy equal equip erase erect erode error
erupt essay ester ethic ethos evade event every evict evoke exact
exalt excel exert exile exist extol extra exult eying fable faced
facet fader faery fagot faint fairy faith faker falls false famed
fancy fared farms fated fatty fault fauna favor feast feats fecal
fence feral ferry fetal fetch feted fetid fetus fever fewer feyer
fiber field fiery fifth fifty fight filer films filmy filth final
finds fines finer finis finny fired firms first fishy fiver fixed
fizzy fjord flack flail flair flake flaky flame flank flare flash
flask flats flaws flank fleck flees fleet flesh flick flier flies
fling flint flips flirt flock flood floor flora flour flout flown
flubs flues fluff fluid fluke flume flung flunk flush flute focal
focus foggy foist folds folio folks folly fonts foods fools foray
force forge forks forms forth forty forum found fount frail frame
frank fraud freak freed freer fresh fried frill frisk frizz frock
frond front frost froth frown froze fruit fuels fully fumed funds
funny furry fused fussy fuzzy gable gaffe gaily gains gamer games
gamey gamma gamut gates gauge gaunt gauze gavel gawky gazed gears
genie genre germy ghost ghoul giant gibed girth given gives glade
glair gland glare glass glaze gleam glean glide glint gloat globe
gloom glory gloss glove glows glued gnash gnaws gnome goals goats
godly going gonad goner goody gooey goofy goofs gored gorge gouge
gourd grace grade graft grail grain grand grant grape graph grasp
grass grate grave gravy graze great greed green greet grey grids
grief grill grime grimy grind grins gripe grist grits groan groin
groom grope gross group grout grove growl grown grubs gruff grump
guard guava guess guest guide guild guile guilt guise gulch gulfs
gulps gummy gurus gushy gusto gutsy gypsy habit hacks hadst hairy
halls halve hands handy happy hardy harem harms harps harsh hash
hasty hatch hated haunt haven havoc hawks hazed heads heady heald
heals heaps heard heart heath heave heavy hedge hefty helix helms
helps hence herbs herds hertz hewed hijab hikes hilly hinds hinge
hints hippo hippy hired hires hitch hives hoard hobby hokum holds
holes holly homer homes honey honor hoods hoofs hooks hooky hoops
hoots hopes horde horny horns horse hosed hosts hotel hound hours
house hover howdy howls hubby hulks hulls human humid humor humps
humus hunch hunks hunts hurly hurry husks husky hyena ideal ideas
idiom idiot idled idler idols igloo image imbue impel imply inane
inapt incur index inept inert infer ingot inked inlet inner input
inset inter intro irate ivied ivory jaded jaunt jeans jelly jerks
jetty jewel jiggy jilts jingo jinks jived jokes jolly joust judge
juice juicy jumbo jumps jumpy junks junky junta juror karat karma
kayak kebab keels keeps khaki kicks kiddy kilos kilts kinds kindy
kings kinky kiosk kites kitty knack knead kneed kneel knees knelt
knife knits knock knoll knots known knows koala krill labor laced
laces lacks laden ladle laggy laity laker lakes lamb lamed lamer
lamps lance lands lanes lanky lapel lapse large larva laser lasso
lasts latch later lathe latte lauds laugh layer leach leads leafy
leaky leans leant leaps learn lease leash least leave ledge leech
leers lefty legal leggy lemon lemur leper level lever liars libel
licks lifts light liked likes liken lilac limbo limbs lined linen
liner lines lingo links lions lipid lipo liter lithe liver lives
livid llama loads loafs loamy loath lobby local locks locos locum
locus lodge loess lofts lofty logic loins loner loops loose loots
lords lorry loser louse lousy loved lover lowly loyal lucid lucky
lulls lumen lumpy lunar lunch lunge lupus lurch lured lurex lurid
lusts lusty lying lymph lynch lyric macho macro madam madly mafia
magic magma magpie maids mails major maker males mamba mambo manga
mange mango mangy mania manic manor maple march marks marry marsh
masks mason match mates matte mayor maybe meals meant meaty mecca
medal media medic meets melee melon melts memes mends mercy merge
merit merry mesas meshy messy metal meter metro micro might milks
milky mimic minds mined miner minis mints minus minty mirth missy
mists misty mixed mixer moans moats mocha modal model modem moist
molar molds molly molts money monks month moody moose moped morph
moths motif motor motto moult mound mount mourn mouse mouth mover
moves movie mowed muddy mucus muffs muggy mules mummy munch mural
murks murky mushy music musky musty mutes mutts myrrh myths nadir
naive named names nanny napes nappy nasal nasty natal naval navel
navvy nears necks needs needy negro neigh nerds nerve nests never
newer newly nicer niche niece night nines ninja ninny ninth nippy
nitre nitty nixed noble nobly nodes noisy nomad nooks noons norms
north nosed noses nosey notch noted notes novas novel nudge nudie
nulls numbs nurse nutty nylon nymph oaken oases oasis oaths obese
ocean octal octet odder odors offal offed offer often okays older
olive omega omits onion onset opens opera opine opted optic orals
orate orbit orcas order ordos organ other otter ought ounce outed
outer ovals ovary overs overt owing owned owner oxide ozone paced
pacer paces packs paddy pages paint pairs paled paler palms panda
panel panic pansy pants papal paper parka parks parry parse parts
party pasta paste pasts patch path pause paved paver paves pawns
peace peach pearl pecan pedal peeks peels peers pence penny peony
perch peril perky perms pesky pesto petal petty phase phone photo
piano piety piggy piled piles pills pilot pimps pinch pines piney
pinks pinto pints piped piper pipes pithy pivot pixel pixie pizza
place plain plait plane plank plans plant plate plays plaza plead
pleat plops plots plows pluck plugs plume plump plums plumy plunk
plush poach poems poets point poise poker poles polio polka polls
polyp pools poppy porch pores pork ports posed poses posit posse
pouch pound pours pouts power prank prawn prays preen press price
prick pride pried prime primp print prior prism prize probe prods
prone prong proof props prose proud prove prowl proxy prune psalm
pubic pudgy puffs puffy pulpy pulse pumps punch punks pupae pupal
puppy puree purge purrs purse pushy putts pygmy quack quads quaff
quail quake quarrel quart quash quasi queen queer quell query quest
queue quick quiet quill quilt quirk quirt quite quota quote quoth
rabbi rabid racer races racks radar radii radio rails rains rainy
raise rajah rally ramps ranch rangy ranks rants rapid rarer rated
rates ratio raved raven raver razed razor reach react reads ready
reams reaps rears rebar rebel rebut recap recur reedy reefs refer
refit reign reins relax relay remit renal renew rents repay repel
reply rerun resin resit retch retro retry reuse revel revue rheas
rhino rhyme rider rides ridge rifle right rigid riled rimes rinds
rings rinse riots ripen riped riper rises risky rites rival river
rivet roach roads roams roars roast robed robes robin robot rocks
rocky rodeo rogue roles rolls roman romeo rooms roomy roost roots
ropes roses rosin rouge rough round route routs roved rover rowed
royal rubes ruddy ruder ruffs ruler rumba rummy rumor rural rused
rushy rusts rusty sable sacks sadly safer safes saint sakes salad
sales sally salon salsa salts salty salvo sandy saner sappy saree
sassy satin sauce saucy sauna saved saves savor savvy sawed scabs
scads scald scale scalp scaly scams scans scant scaps scare scarf
scary scene scent scion scoff scold scones scoop scoot scope score
scorn scour scout scowl scram scrap scree screw scrim scrub scuba
seams seamy seats sects sedan seeds seedy seems seeps sees seize
sells semis sends sense sepia serfs serif serum serve seven sever
sewed sewer shack shade shady shaft shaggy shake shaky shale shall
shame shams shape shard share shark sharp shave shawl shear sheaf
sheen sheep sheer sheet sheik shelf shell shied shift shims shine
shins shire shirk shirt shoal shock shoed shoes shone shook shoot
shops shore shorn short shorn shots shout shove shown shows shred
shrew shrub shrug shuns shush shuts shyly siege sieve sift sighs
sight sigma silks silky silly silos since sines sings singe sinks
siren sisal sissy sites sixes sixth sixty sized skate skews skids
skier skies skiff skill skimp skims skins skip skirt skull skunk
slabs slack slags slain slake slams slang slant slaps slash slate
slats slave slays sleds sleek sleep sleet slept slew slice slick
slide slime slimy sling slink slips slits slobs sloop slope slosh
sloth slows sluff slugs slums slung slunk slurp slurs slush sluts
slyly small smart smash smear smell smelt smile smirk smith smock
smogs smoke smoky smote smugs snack snags snail snake snaky snap
snare snarl sneak sneer snick snide sniff snipe snips snits snobs
snoek snoop snore snort snots snout snowy snubs snuck snuff snugs
soaks soaps soapy soars sober socks soda sodas softs soggy soils
solar solds soled soles solid solve sonar songs sonic sooty soppy
sores sorts sough souls sound soups soupy sours south sowed sower
sown space spade spans spare spark spars spasm spats spawn speak
spear specks speed spell spelt spend spent sperm spice spicy spied
spiel spies spike spiky spill spilt spine spins spiny spire spite
spits splat splay splice spoil spoke spook spool spoon spoor spore
sport spots spout spray spree sprig spry spud spume spurn spurs
squab squad squat squaw squid stabs stack staff stage stags staid
stain stair stake stale stalk stall stamp stand stank stare stark
start stash state stave stays stead steak steal steam steed steel
steep steer stein stems steno stews stick stiff stile still stilt
sting stink stint stoat stock stoic stoke stole stomp stone stony
stood stool stoop stops store stork storm story stove strap straw
stray strep strew strip strop stubs stuck studs study stuff stump
stuns stunt sturdy style suave subway sucks suds sugar suing suite
sulfa sulks sulky sully sumac sunny super sured surer surge surfs
surge surls surly sushi swabs swain swamp swans swaps sward swarm
sweat sweep sweet swell swept swift swill swims swine swing swipe
swirl swish switch swoon swoop sword swore sworn swung synch synod
syrup table taboo tacit tacky taffy tails takes taken taker tales
talky talls tally tame tamps tangy tanks taped taper tapes tapir
tarry tarts taste tasty tatty taunt tawny taxed taxis taxon teach
teaks teals teams tears teary tease teats teddy teems teens teeth
tempo temps tends tenet tenon tenor tense tenth tents tepee tepid
terms terry tests testy thaws theft their theme there these thick
thief thigh thine thing think third thorn those thrum thumb thump
thyme tiara tibia tidal tides tidy tiers tiger tight tilde tiled
tiles tilts timed timer times timid tined tinge tints tipsy tired
title toast today toddy token tomes tonal tones tonga tongs tonic
tools tooth toots topaz topic torch tores torsi torso torts torus
total totem touch tough tours towed towel tower towns toxic toxin
toyed trace track tract trade trail train trait tramp traps trash
trawl tread treat trees trend tress tribe trice trick tried tries
trike trill tripe trips trite troll troop trope troth trout trove
truce truck truer truly trump trunk truss trust truth tryst tubal
tubas tubed tubes tubs tucks tuffs tufts tulip tulles tumid tummy
tumor tunas tuned tuner tunes tunic turbo turfs turns tutor twang
tweak tweed tweet twice twigs twins twirl twist twit udder ulcer
ultra umbra uncle uncut under undid undue unfed unfit unify union
unite unity unlit unmet unset until unwed unzip upper upset urban
urged urges urine usage user using usual usurp utile uvula vacua
vague vales valet valid valor value valve vamps vapid vapor vases
vault vaunt veers veils veins venom vents venue verbs verge verse
verso verve vests vetch vexed video viler villa vines viola viper
viral virgo virus visas visit visor vista vital vivid vixen vocal
vodka vogue voice voids voile volts vomit voted votes vouch vowed
vowel voyer wacky waded wader wades wafer waged wager wages wagon
waist waits waive walks walls walts waltz wand wands waned wanes
wants wards wares warms warns warps warts wars wary washy waste
watch water waved waver waves waxed waxen waxes weave wedge weeds
weeks weeps weigh weird wells welsh wench wedge whack whale wharf
wheat wheel wheey when whelp where which whiff while whims whine
whirl whisk white whole whoop whose widen wider widow width wield
wifey wilds wiles wilts wimpy wince winch winds windy wines wings
winks wiped wiper wires wiry wisps witch wives wokes woken woman
women wonky woods woody wooed woofs woozy words wordy works world
worms wormy worry worse worst worth would wound woven wowed wrack
wraps wrath wreak wreck wrens wrest wried wring wrist write writs
wrong wrote wryly yacht yarns yawns yeahs yearn years yeast yells
yelps yield yodel yokel yolks young youth yummy zebra zeros zesty
zilch zinc zonal zones zoned
`;

const SET = new Set(
  RAW
    .split(/\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length === 5),
);

export const WORDS: string[] = Array.from(SET).sort();

export function isValidWord(w: string): boolean {
  return SET.has(w.toLowerCase());
}
