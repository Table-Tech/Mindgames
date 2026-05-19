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
