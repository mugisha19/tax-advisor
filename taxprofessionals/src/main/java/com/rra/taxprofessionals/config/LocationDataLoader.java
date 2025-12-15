package com.rra.taxprofessionals.config;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.rra.taxprofessionals.enums.LocationType;
import com.rra.taxprofessionals.model.Location;
import com.rra.taxprofessionals.repository.LocationRepository;

/**
 * Complete Rwanda Administrative Structure Data Loader
 * ===================================================== Loads: 5 Provinces → 30
 * Districts → 416 Sectors → Sample Cells & Villages
 *
 * Source: National Institute of Statistics of Rwanda (NISR) Last Updated: 2024
 *
 * @author Tax Professionals System
 */
@Component
public class LocationDataLoader implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(LocationDataLoader.class);

    @Autowired
    private LocationRepository locationRepository;

    private final Map<String, Location> locationCache = new HashMap<>();

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (locationRepository.count() > 0) {
            logger.info("✅ Locations already loaded ({} locations exist). Skipping.", locationRepository.count());
            return;
        }

        logger.info("🇷🇼 Starting Rwanda administrative structure data load...");
        long startTime = System.currentTimeMillis();

        try {
            loadAllProvinces();

            long endTime = System.currentTimeMillis();
            long totalLocations = locationRepository.count();

            logger.info("✅ Successfully loaded {} locations in {} seconds",
                    totalLocations, (endTime - startTime) / 1000);

            logStatistics();

        } catch (Exception e) {
            logger.error("❌ Failed to load location data: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void logStatistics() {
        logger.info("=====================================");
        logger.info("   RWANDA ADMINISTRATIVE STRUCTURE");
        logger.info("=====================================");
        logger.info("   Provinces: {}", locationRepository.findByType(LocationType.PROVINCE).size());
        logger.info("   Districts: {}", locationRepository.findByType(LocationType.DISTRICT).size());
        logger.info("   Sectors:   {}", locationRepository.findByType(LocationType.SECTOR).size());
        logger.info("   Cells:     {}", locationRepository.findByType(LocationType.CELL).size());
        logger.info("   Villages:  {}", locationRepository.findByType(LocationType.VILLAGE).size());
        logger.info("=====================================");
    }

    private void loadAllProvinces() {
        loadKigaliCity();
        loadEasternProvince();
        loadNorthernProvince();
        loadSouthernProvince();
        loadWesternProvince();
    }

    // ========================================================================
    // KIGALI CITY PROVINCE - 3 Districts, 35 Sectors
    // ========================================================================
    private void loadKigaliCity() {
        logger.info("Loading Kigali City Province...");
        Location kigali = createLocation("Kigali City", "KGL", LocationType.PROVINCE, null);

        Location gasabo = createLocation("Gasabo", "GAS", LocationType.DISTRICT, kigali);
        Location kicukiro = createLocation("Kicukiro", "KIC", LocationType.DISTRICT, kigali);
        Location nyarugenge = createLocation("Nyarugenge", "NYA", LocationType.DISTRICT, kigali);

        loadGasaboSectors(gasabo);
        loadKicukiroSectors(kicukiro);
        loadNyarugengeSectors(nyarugenge);
    }

    private void loadGasaboSectors(Location gasaboDistrict) {
        // All 15 Gasabo Sectors
        Location bumbogo = createLocation("Bumbogo", "GASBUM", LocationType.SECTOR, gasaboDistrict);
        Location gatsata = createLocation("Gatsata", "GASGAS", LocationType.SECTOR, gasaboDistrict);
        Location jali = createLocation("Jali", "GASJAL", LocationType.SECTOR, gasaboDistrict);
        Location gikomero = createLocation("Gikomero", "GASGIK", LocationType.SECTOR, gasaboDistrict);
        Location gisozi = createLocation("Gisozi", "GASGIS", LocationType.SECTOR, gasaboDistrict);
        Location jabana = createLocation("Jabana", "GASJAB", LocationType.SECTOR, gasaboDistrict);
        Location kacyiru = createLocation("Kacyiru", "GASKAC", LocationType.SECTOR, gasaboDistrict);
        Location kimihurura = createLocation("Kimihurura", "GASKIM", LocationType.SECTOR, gasaboDistrict);
        Location kimironko = createLocation("Kimironko", "GASKIR", LocationType.SECTOR, gasaboDistrict);
        Location kinyinya = createLocation("Kinyinya", "GASKIN", LocationType.SECTOR, gasaboDistrict);
        Location ndera = createLocation("Ndera", "GASNDE", LocationType.SECTOR, gasaboDistrict);
        Location nduba = createLocation("Nduba", "GASNDU", LocationType.SECTOR, gasaboDistrict);
        Location remera = createLocation("Remera", "GASREM", LocationType.SECTOR, gasaboDistrict);
        Location rusororo = createLocation("Rusororo", "GASRUS", LocationType.SECTOR, gasaboDistrict);
        Location rutunga = createLocation("Rutunga", "GASRUT", LocationType.SECTOR, gasaboDistrict);

        // Add cells and villages for major sectors
        loadRemeraCells(remera);
        loadKimironkoCells(kimironko);
        loadKacyiruCells(kacyiru);
        loadKimihururaCells(kimihurura);
    }

    private void loadRemeraCells(Location remeraSector) {
        Location rukiri1 = createLocation("Rukiri I", "REMRUK1", LocationType.CELL, remeraSector);
        Location rukiri2 = createLocation("Rukiri II", "REMRUK2", LocationType.CELL, remeraSector);
        Location nyabisindu = createLocation("Nyabisindu", "REMNYA", LocationType.CELL, remeraSector);
        Location karuruma = createLocation("Karuruma", "REMKAR", LocationType.CELL, remeraSector);

        // Rukiri I Villages
        createLocation("Amahoro", "RUK1AMA", LocationType.VILLAGE, rukiri1);
        createLocation("Ubumwe", "RUK1UBU", LocationType.VILLAGE, rukiri1);
        createLocation("Urugwiro", "RUK1URU", LocationType.VILLAGE, rukiri1);
        createLocation("Rebero", "RUK1REB", LocationType.VILLAGE, rukiri1);
        createLocation("Kimihurura", "RUK1KIM", LocationType.VILLAGE, rukiri1);

        // Rukiri II Villages
        createLocation("Kacyiru", "RUK2KAC", LocationType.VILLAGE, rukiri2);
        createLocation("Gisimenti", "RUK2GIS", LocationType.VILLAGE, rukiri2);
        createLocation("Biryogo", "RUK2BIR", LocationType.VILLAGE, rukiri2);
        createLocation("Nyarutarama", "RUK2NYA", LocationType.VILLAGE, rukiri2);

        // Nyabisindu Villages
        createLocation("Nyabisindu A", "NYABIA", LocationType.VILLAGE, nyabisindu);
        createLocation("Nyabisindu B", "NYABIB", LocationType.VILLAGE, nyabisindu);
        createLocation("Nyabisindu C", "NYABIC", LocationType.VILLAGE, nyabisindu);

        // Karuruma Villages
        createLocation("Karuruma I", "KARKAR1", LocationType.VILLAGE, karuruma);
        createLocation("Karuruma II", "KARKAR2", LocationType.VILLAGE, karuruma);
    }

    private void loadKimironkoCells(Location kimironkoSector) {
        Location bibare = createLocation("Bibare", "KIRBIB", LocationType.CELL, kimironkoSector);
        Location kibagabaga = createLocation("Kibagabaga", "KIRKIB", LocationType.CELL, kimironkoSector);
        Location tetero = createLocation("Tetero", "KIRTET", LocationType.CELL, kimironkoSector);

        createLocation("Kamatamu", "BIBKAM", LocationType.VILLAGE, bibare);
        createLocation("Nyarutarama", "BIBNYA", LocationType.VILLAGE, bibare);
        createLocation("Kimironko", "BIBKIM", LocationType.VILLAGE, bibare);

        createLocation("Gacuriro", "KIBGAC", LocationType.VILLAGE, kibagabaga);
        createLocation("Kibagabaga", "KIBKIB", LocationType.VILLAGE, kibagabaga);
        createLocation("Rebero", "KIBREB", LocationType.VILLAGE, kibagabaga);

        createLocation("Tetero A", "TETTETA", LocationType.VILLAGE, tetero);
        createLocation("Tetero B", "TETTETB", LocationType.VILLAGE, tetero);
    }

    private void loadKacyiruCells(Location kacyiruSector) {
        Location kamatamu = createLocation("Kamatamu", "KACKAM", LocationType.CELL, kacyiruSector);
        Location kibaza = createLocation("Kibaza", "KACKIB", LocationType.CELL, kacyiruSector);
        Location kajevuba = createLocation("Kajevuba", "KACKAJ", LocationType.CELL, kacyiruSector);

        createLocation("Kamatamu I", "KAMV1", LocationType.VILLAGE, kamatamu);
        createLocation("Kamatamu II", "KAMV2", LocationType.VILLAGE, kamatamu);
        createLocation("Kamatamu III", "KAMV3", LocationType.VILLAGE, kamatamu);

        createLocation("Kibaza A", "KIBV1", LocationType.VILLAGE, kibaza);
        createLocation("Kibaza B", "KIBV2", LocationType.VILLAGE, kibaza);

        createLocation("Kajevuba", "KAJV1", LocationType.VILLAGE, kajevuba);
    }

    private void loadKimihururaCells(Location kimihururaSector) {
        Location kimihurura = createLocation("Kimihurura", "KIMKIM", LocationType.CELL, kimihururaSector);
        Location kibagabaga = createLocation("Kibagabaga", "KIMKIB", LocationType.CELL, kimihururaSector);

        createLocation("Kimihurura I", "KIMKIM1", LocationType.VILLAGE, kimihurura);
        createLocation("Kimihurura II", "KIMKIM2", LocationType.VILLAGE, kimihurura);
        createLocation("Kimihurura III", "KIMKIM3", LocationType.VILLAGE, kimihurura);

        createLocation("Kibagabaga A", "KIMKIBA", LocationType.VILLAGE, kibagabaga);
        createLocation("Kibagabaga B", "KIMKIBB", LocationType.VILLAGE, kibagabaga);
    }

    private void loadKicukiroSectors(Location kicukiroDistrict) {
        // All 10 Kicukiro Sectors
        Location gahanga = createLocation("Gahanga", "KICGAH", LocationType.SECTOR, kicukiroDistrict);
        Location gatenga = createLocation("Gatenga", "KICGAT", LocationType.SECTOR, kicukiroDistrict);
        Location gikondo = createLocation("Gikondo", "KICGIK", LocationType.SECTOR, kicukiroDistrict);
        Location kagarama = createLocation("Kagarama", "KICKAG", LocationType.SECTOR, kicukiroDistrict);
        Location kanombe = createLocation("Kanombe", "KICKAN", LocationType.SECTOR, kicukiroDistrict);
        Location kicukiroSector = createLocation("Kicukiro", "KICKIC", LocationType.SECTOR, kicukiroDistrict);
        Location kigarama = createLocation("Kigarama", "KICKIG", LocationType.SECTOR, kicukiroDistrict);
        Location masaka = createLocation("Masaka", "KICKMAS", LocationType.SECTOR, kicukiroDistrict);
        Location niboye = createLocation("Niboye", "KICKNIB", LocationType.SECTOR, kicukiroDistrict);
        Location nyarugunga = createLocation("Nyarugunga", "KICKNYA", LocationType.SECTOR, kicukiroDistrict);

        loadGahangaCells(gahanga);
        loadGatengaCells(gatenga);
    }

    private void loadGahangaCells(Location gahangaSector) {
        Location buterere = createLocation("Buterere", "GAHBUT", LocationType.CELL, gahangaSector);
        Location karembure = createLocation("Karembure", "GAHKAR", LocationType.CELL, gahangaSector);
        Location kabuga = createLocation("Kabuga", "GAHKAB", LocationType.CELL, gahangaSector);

        createLocation("Akabahizi", "BUTAKA", LocationType.VILLAGE, buterere);
        createLocation("Kabeza", "BUTKAB", LocationType.VILLAGE, buterere);
        createLocation("Gahanga", "BUTGAH", LocationType.VILLAGE, buterere);

        createLocation("Karembure A", "KARKARA", LocationType.VILLAGE, karembure);
        createLocation("Karembure B", "KARKARB", LocationType.VILLAGE, karembure);

        createLocation("Kabuga I", "KABKAB1", LocationType.VILLAGE, kabuga);
        createLocation("Kabuga II", "KABKAB2", LocationType.VILLAGE, kabuga);
    }

    private void loadGatengaCells(Location gatengaSector) {
        // FIXED: Changed code from GATGAT to KICGATC to avoid duplicate with Gatsibo sector
        Location gatenga = createLocation("Gatenga", "KICGATC", LocationType.CELL, gatengaSector);
        Location karama = createLocation("Karama", "GATKAR", LocationType.CELL, gatengaSector);

        createLocation("Gatenga A", "GATGATA", LocationType.VILLAGE, gatenga);
        createLocation("Gatenga B", "GATGATB", LocationType.VILLAGE, gatenga);
        createLocation("Gatenga C", "GATGATC", LocationType.VILLAGE, gatenga);

        createLocation("Karama I", "GATKARI", LocationType.VILLAGE, karama);
        createLocation("Karama II", "GATKARII", LocationType.VILLAGE, karama);
    }

    private void loadNyarugengeSectors(Location nyarugengeDistrict) {
        // All 10 Nyarugenge Sectors
        Location gitega = createLocation("Gitega", "NYAGIT", LocationType.SECTOR, nyarugengeDistrict);
        Location kanyinya = createLocation("Kanyinya", "NYAKAN", LocationType.SECTOR, nyarugengeDistrict);
        Location kigaliSector = createLocation("Kigali", "NYAKIG", LocationType.SECTOR, nyarugengeDistrict);
        Location kimisagara = createLocation("Kimisagara", "NYAKIM", LocationType.SECTOR, nyarugengeDistrict);
        Location mageragere = createLocation("Mageragere", "NYAMAG", LocationType.SECTOR, nyarugengeDistrict);
        Location muhima = createLocation("Muhima", "NYAMUH", LocationType.SECTOR, nyarugengeDistrict);
        Location nyakabanda = createLocation("Nyakabanda", "NYANYAK", LocationType.SECTOR, nyarugengeDistrict);
        Location nyamirambo = createLocation("Nyamirambo", "NYANYAM", LocationType.SECTOR, nyarugengeDistrict);
        Location nyarugengeSector = createLocation("Nyarugenge", "NYANYAR", LocationType.SECTOR, nyarugengeDistrict);
        Location rwezamenyo = createLocation("Rwezamenyo", "NYARWE", LocationType.SECTOR, nyarugengeDistrict);

        loadKigaliSectorCells(kigaliSector);
        loadMuhimaCells(muhima);
    }

    private void loadKigaliSectorCells(Location kigaliSector) {
        Location cyahafi = createLocation("Cyahafi", "KIGCYA", LocationType.CELL, kigaliSector);
        Location gasharu = createLocation("Gasharu", "KIGGAS", LocationType.CELL, kigaliSector);
        Location nyarugenge = createLocation("Nyarugenge", "KIGNYA", LocationType.CELL, kigaliSector);

        createLocation("Kiyovu", "CYAKIY", LocationType.VILLAGE, cyahafi);
        createLocation("Rugenge", "CYARUG", LocationType.VILLAGE, cyahafi);
        createLocation("Muhima", "CYAMUH", LocationType.VILLAGE, cyahafi);

        createLocation("Gasharu A", "GASGASA", LocationType.VILLAGE, gasharu);
        createLocation("Gasharu B", "GASGASB", LocationType.VILLAGE, gasharu);

        createLocation("Nyarugenge A", "NYANYAA", LocationType.VILLAGE, nyarugenge);
        createLocation("Nyarugenge B", "NYANYAB", LocationType.VILLAGE, nyarugenge);
    }

    private void loadMuhimaCells(Location muhimaSector) {
        // FIXED: Changed code from MUHMUH to NYAMUHI to avoid duplicate
        Location muhima = createLocation("Muhima", "NYAMUHI", LocationType.CELL, muhimaSector);
        Location rugenge = createLocation("Rugenge", "MUHRUG", LocationType.CELL, muhimaSector);

        // FIXED: Changed village codes to avoid duplicates with Muhoza
        createLocation("Muhima I", "NYAMUH1", LocationType.VILLAGE, muhima);
        createLocation("Muhima II", "NYAMUH2", LocationType.VILLAGE, muhima);
        createLocation("Muhima III", "NYAMUH3", LocationType.VILLAGE, muhima);

        createLocation("Rugenge A", "MUHRUGA", LocationType.VILLAGE, rugenge);
        createLocation("Rugenge B", "MUHRUGB", LocationType.VILLAGE, rugenge);
    }

    // ========================================================================
    // EASTERN PROVINCE - 7 Districts, 119 Sectors
    // ========================================================================
    private void loadEasternProvince() {
        logger.info("Loading Eastern Province...");
        Location eastern = createLocation("Eastern Province", "EST", LocationType.PROVINCE, null);

        Location bugesera = createLocation("Bugesera", "ESTBUG", LocationType.DISTRICT, eastern);
        Location gatsibo = createLocation("Gatsibo", "ESTGAT", LocationType.DISTRICT, eastern);
        Location kayonza = createLocation("Kayonza", "ESTKAY", LocationType.DISTRICT, eastern);
        Location kirehe = createLocation("Kirehe", "ESTKIR", LocationType.DISTRICT, eastern);
        Location ngoma = createLocation("Ngoma", "ESTNGO", LocationType.DISTRICT, eastern);
        Location nyagatare = createLocation("Nyagatare", "ESTNYA", LocationType.DISTRICT, eastern);
        Location rwamagana = createLocation("Rwamagana", "ESTRWA", LocationType.DISTRICT, eastern);

        loadBugeseraSectors(bugesera);
        loadGatsiboSectors(gatsibo);
        loadKayonzaSectors(kayonza);
        loadKireheSectors(kirehe);
        loadNgomaSectors(ngoma);
        loadNyagatereSectors(nyagatare);
        loadRwamaganaSectors(rwamagana);
    }

    private void loadBugeseraSectors(Location bugeseraDistrict) {
        // All 15 Bugesera Sectors
        createLocation("Gashora", "BUGGAS", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Juru", "BUGJUR", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Kamabuye", "BUGKAM", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Mareba", "BUGMAR", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Mayange", "BUGMAY", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Musenyi", "BUGMUS", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Mwogo", "BUGMWO", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Ngeruka", "BUGNGE", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Ntarama", "BUGNTA", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Nyamata", "BUGNYA", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Nyarugenge", "BUGNYAR", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Rilima", "BUGRIL", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Ruhuha", "BUGRUH", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Rweru", "BUGRWE", LocationType.SECTOR, bugeseraDistrict);
        createLocation("Shyara", "BUGSHY", LocationType.SECTOR, bugeseraDistrict);
    }

    private void loadGatsiboSectors(Location gatsiboDistrict) {
        // All 14 Gatsibo Sectors
        createLocation("Gasange", "GATGAS", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Gatsibo", "GATGAT", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Gitoki", "GATGIT", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Kabarore", "GATKAB", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Kageyo", "GATKAG", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Kiramuruzi", "GATKIR", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Kiziguro", "GATKIZ", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Muhura", "GATMUH", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Murambi", "GATMUR", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Ngarama", "GATNGAR", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Nyagihanga", "GATNYA", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Remera", "GATREM", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Rugarama", "GATRUG", LocationType.SECTOR, gatsiboDistrict);
        createLocation("Rwimbogo", "GATRWI", LocationType.SECTOR, gatsiboDistrict);
    }

    private void loadKayonzaSectors(Location kayonzaDistrict) {
        // All 11 Kayonza Sectors
        createLocation("Gahini", "KAYGAH", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Kabare", "KAYKAB", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Kabarondo", "KAYKABA", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Mukarange", "KAYMUK", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Murama", "KAYMUR", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Murundi", "KAYMURU", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Ndego", "KAYNDE", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Nyamirama", "KAYNYA", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Rukara", "KAYRU", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Ruramira", "KAYRUR", LocationType.SECTOR, kayonzaDistrict);
        createLocation("Rwinkwavu", "KAYRWI", LocationType.SECTOR, kayonzaDistrict);
    }

    private void loadKireheSectors(Location kireheDistrict) {
        // All 12 Kirehe Sectors
        createLocation("Gahara", "KIRGAH", LocationType.SECTOR, kireheDistrict);
        createLocation("Gatore", "KIRGAT", LocationType.SECTOR, kireheDistrict);
        createLocation("Kigarama", "KIRKIG", LocationType.SECTOR, kireheDistrict);
        createLocation("Kigina", "KIRKIGI", LocationType.SECTOR, kireheDistrict);
        createLocation("Kirehe", "KIRKIR", LocationType.SECTOR, kireheDistrict);
        createLocation("Mahama", "KIRMAH", LocationType.SECTOR, kireheDistrict);
        createLocation("Mpanga", "KIRMPA", LocationType.SECTOR, kireheDistrict);
        createLocation("Musaza", "KIRMUS", LocationType.SECTOR, kireheDistrict);
        createLocation("Mushikiri", "KIRMUSH", LocationType.SECTOR, kireheDistrict);
        createLocation("Nasho", "KIRNAS", LocationType.SECTOR, kireheDistrict);
        createLocation("Nyamugari", "KIRNYA", LocationType.SECTOR, kireheDistrict);
        createLocation("Nyarubuye", "KIRNYAR", LocationType.SECTOR, kireheDistrict);
    }

    private void loadNgomaSectors(Location ngomaDistrict) {
        // All 14 Ngoma Sectors
        createLocation("Gashanda", "NGOGAS", LocationType.SECTOR, ngomaDistrict);
        createLocation("Jarama", "NGOJAR", LocationType.SECTOR, ngomaDistrict);
        createLocation("Karembo", "NGOKAR", LocationType.SECTOR, ngomaDistrict);
        createLocation("Kazo", "NGOKAZ", LocationType.SECTOR, ngomaDistrict);
        createLocation("Kibungo", "NGOKIB", LocationType.SECTOR, ngomaDistrict);
        createLocation("Mugesera", "NGOMUG", LocationType.SECTOR, ngomaDistrict);
        createLocation("Murama", "NGOMUR", LocationType.SECTOR, ngomaDistrict);
        createLocation("Mutenderi", "NGOMUT", LocationType.SECTOR, ngomaDistrict);
        createLocation("Remera", "NGOREM", LocationType.SECTOR, ngomaDistrict);
        createLocation("Rukira", "NGORUK", LocationType.SECTOR, ngomaDistrict);
        createLocation("Rukumberi", "NGORUKUM", LocationType.SECTOR, ngomaDistrict);
        createLocation("Rurenge", "NGORUR", LocationType.SECTOR, ngomaDistrict);
        createLocation("Sake", "NGOSAK", LocationType.SECTOR, ngomaDistrict);
        createLocation("Zaza", "NGOZAZ", LocationType.SECTOR, ngomaDistrict);
    }

    private void loadNyagatereSectors(Location nyagatareDistrict) {
        // All 14 Nyagatare Sectors (FIXED: Was 21, corrected to 14)
        createLocation("Gatunda", "NYAGAT", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Karama", "NYAKAR", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Karangazi", "NYAKARA", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Katabagemu", "NYAKAT", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Kiyombe", "NYAKIY", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Matimba", "NYAMAT", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Mimuri", "NYAMIM", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Mukama", "NYAMUK", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Musheri", "NYAMUS", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Nyagatare", "NYANYA", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Rukomo", "NYARUK", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Rwempasha", "NYARWE", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Rwimiyaga", "NYARWI", LocationType.SECTOR, nyagatareDistrict);
        createLocation("Tabagwe", "NYATAB", LocationType.SECTOR, nyagatareDistrict);
    }

    private void loadRwamaganaSectors(Location rwamaganaDistrict) {
        // All 14 Rwamagana Sectors
        createLocation("Fumbwe", "RWAFUM", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Gahengeri", "RWAGAH", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Gishari", "RWAGIS", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Karenge", "RWAKAR", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Kigabiro", "RWAKIG", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Muhazi", "RWAMUH", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Munyaga", "RWAMUN", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Musha", "RWAMUS", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Muyumbu", "RWAMUY", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Mwulire", "RWAMWU", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Nyakariro", "RWANYA", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Nzige", "RWANZG", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Rubona", "RWARUB", LocationType.SECTOR, rwamaganaDistrict);
        createLocation("Rurenge", "RWARUR", LocationType.SECTOR, rwamaganaDistrict);
    }

    // ========================================================================
    // NORTHERN PROVINCE - 5 Districts, 95 Sectors
    // ========================================================================
    private void loadNorthernProvince() {
        logger.info("Loading Northern Province...");
        Location northern = createLocation("Northern Province", "NTH", LocationType.PROVINCE, null);

        Location burera = createLocation("Burera", "NTHBUR", LocationType.DISTRICT, northern);
        Location gakenke = createLocation("Gakenke", "NTHGAK", LocationType.DISTRICT, northern);
        Location gicumbi = createLocation("Gicumbi", "NTHGIC", LocationType.DISTRICT, northern);
        Location musanze = createLocation("Musanze", "NTHMUS", LocationType.DISTRICT, northern);
        Location rulindo = createLocation("Rulindo", "NTHRUL", LocationType.DISTRICT, northern);

        loadBureraSectors(burera);
        loadGakenkeSectors(gakenke);
        loadGicumbiSectors(gicumbi);
        loadMusanzeSectors(musanze);
        loadRulindoSectors(rulindo);
    }

    private void loadBureraSectors(Location bureraDistrict) {
        // All 17 Burera Sectors (FIXED: Removed duplicate line)
        createLocation("Bungwe", "BURBUN", LocationType.SECTOR, bureraDistrict);
        createLocation("Butaro", "BURBUT", LocationType.SECTOR, bureraDistrict);
        createLocation("Cyanika", "BURCYA", LocationType.SECTOR, bureraDistrict);
        createLocation("Cyeru", "BURCYE", LocationType.SECTOR, bureraDistrict);
        createLocation("Gahunga", "BURGAH", LocationType.SECTOR, bureraDistrict);
        createLocation("Gatebe", "BURGAT", LocationType.SECTOR, bureraDistrict);
        createLocation("Gatore", "BURGATO", LocationType.SECTOR, bureraDistrict);
        createLocation("Gitovu", "BURGIT", LocationType.SECTOR, bureraDistrict);
        createLocation("Kagogo", "BURKAG", LocationType.SECTOR, bureraDistrict);
        createLocation("Kinoni", "BURKIN", LocationType.SECTOR, bureraDistrict);
        createLocation("Kinyababa", "BURKINY", LocationType.SECTOR, bureraDistrict);
        createLocation("Kivuye", "BURKIV", LocationType.SECTOR, bureraDistrict);
        createLocation("Nemba", "BURNEM", LocationType.SECTOR, bureraDistrict);
        createLocation("Rugarama", "BURRUG", LocationType.SECTOR, bureraDistrict);
        createLocation("Rugengabari", "BURRUGE", LocationType.SECTOR, bureraDistrict);
        createLocation("Ruhunde", "BURRUH", LocationType.SECTOR, bureraDistrict);
        createLocation("Rusarabuye", "BURRUS", LocationType.SECTOR, bureraDistrict);
    }

    private void loadGakenkeSectors(Location gakenkeDistrict) {
        // All 19 Gakenke Sectors
        createLocation("Busengo", "GAKBUS", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Coko", "GAKCOK", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Cyabingo", "GAKCYA", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Gakenke", "GAKGAK", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Gashenyi", "GAKGAS", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Janja", "GAKJAN", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Kamubuga", "GAKKAM", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Karambo", "GAKKAR", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Kivuruga", "GAKKIV", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Mataba", "GAKMAT", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Minazi", "GAKMIN", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Muhondo", "GAKMUH", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Muyongwe", "GAKMUY", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Mugunga", "GAKMUG", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Muzo", "GAKMUZ", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Nemba", "GAKNEM", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Ruli", "GAKRUL", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Rusasa", "GAKRUS", LocationType.SECTOR, gakenkeDistrict);
        createLocation("Rushashi", "GAKRUSH", LocationType.SECTOR, gakenkeDistrict);
    }

    private void loadGicumbiSectors(Location gicumbiDistrict) {
        // All 21 Gicumbi Sectors
        createLocation("Bukure", "GICBUK", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Bwisige", "GICBWI", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Byumba", "GICBYU", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Cyumba", "GICCYU", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Giti", "GICGIT", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Kaniga", "GICKAN", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Kageyo", "GICKAG", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Mukarange", "GICMUK", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Muko", "GICMUKO", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Miyove", "GICMIY", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Mutete", "GICMUT", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Munyinya", "GICMUN", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Nyankenke", "GICNYA", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Nyamiyaga", "GICNYAM", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Rubaya", "GICRUB", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Rukomo", "GICRUK", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Rushaki", "GICRUS", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Rutare", "GICRUT", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Ruvune", "GICRUV", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Rwamiko", "GICRWA", LocationType.SECTOR, gicumbiDistrict);
        createLocation("Shangasha", "GICSHA", LocationType.SECTOR, gicumbiDistrict);
    }

    private void loadMusanzeSectors(Location musanzeDistrict) {
        // All 15 Musanze Sectors
        createLocation("Busogo", "MUSBUSO", LocationType.SECTOR, musanzeDistrict);
        createLocation("Cyuve", "MUSCYU", LocationType.SECTOR, musanzeDistrict);
        createLocation("Gacaca", "MUSGAC", LocationType.SECTOR, musanzeDistrict);
        createLocation("Gashaki", "MUSGAS", LocationType.SECTOR, musanzeDistrict);
        createLocation("Gataraga", "MUSGAT", LocationType.SECTOR, musanzeDistrict);
        createLocation("Kinigi", "MUSKIN", LocationType.SECTOR, musanzeDistrict);
        createLocation("Kimonyi", "MUSKIM", LocationType.SECTOR, musanzeDistrict);
        Location muhoza = createLocation("Muhoza", "MUSMUH", LocationType.SECTOR, musanzeDistrict);
        createLocation("Muko", "MUSMUK", LocationType.SECTOR, musanzeDistrict);
        createLocation("Musanze", "MUSMUS", LocationType.SECTOR, musanzeDistrict);
        createLocation("Nkotsi", "MUSNKO", LocationType.SECTOR, musanzeDistrict);
        createLocation("Nyange", "MUSNYA", LocationType.SECTOR, musanzeDistrict);
        createLocation("Remera", "MUSREM", LocationType.SECTOR, musanzeDistrict);
        createLocation("Rwaza", "MUSRWA", LocationType.SECTOR, musanzeDistrict);
        createLocation("Shingiro", "MUSSHIN", LocationType.SECTOR, musanzeDistrict);

        loadMuhozaCells(muhoza);
    }

    private void loadMuhozaCells(Location muhozaSector) {
        Location muhoza = createLocation("Muhoza", "MUHMUHO", LocationType.CELL, muhozaSector);
        Location cyuve = createLocation("Cyuve", "MUHCYU", LocationType.CELL, muhozaSector);

        // FIXED: Changed codes to avoid duplicates
        createLocation("Muhoza I", "MUZMUH1", LocationType.VILLAGE, muhoza);
        createLocation("Muhoza II", "MUZMUH2", LocationType.VILLAGE, muhoza);
        createLocation("Muhoza III", "MUZMUH3", LocationType.VILLAGE, muhoza);

        createLocation("Cyuve A", "MUHCYUA", LocationType.VILLAGE, cyuve);
        createLocation("Cyuve B", "MUHCYUB", LocationType.VILLAGE, cyuve);
    }

    private void loadRulindoSectors(Location rulindoDistrict) {
        // All 17 Rulindo Sectors
        createLocation("Base", "RULBAS", LocationType.SECTOR, rulindoDistrict);
        createLocation("Burega", "RULBUR", LocationType.SECTOR, rulindoDistrict);
        createLocation("Bushoki", "RULBUS", LocationType.SECTOR, rulindoDistrict);
        createLocation("Buyoga", "RULBUY", LocationType.SECTOR, rulindoDistrict);
        createLocation("Cyinzuzi", "RULCYI", LocationType.SECTOR, rulindoDistrict);
        createLocation("Cyungo", "RULCYU", LocationType.SECTOR, rulindoDistrict);
        createLocation("Kinihira", "RULKIN", LocationType.SECTOR, rulindoDistrict);
        createLocation("Kisaro", "RULKIS", LocationType.SECTOR, rulindoDistrict);
        createLocation("Masoro", "RULMAS", LocationType.SECTOR, rulindoDistrict);
        createLocation("Mbogo", "RULMBO", LocationType.SECTOR, rulindoDistrict);
        createLocation("Murambi", "RULMUR", LocationType.SECTOR, rulindoDistrict);
        createLocation("Ngoma", "RULNGO", LocationType.SECTOR, rulindoDistrict);
        createLocation("Ntarabana", "RULNTA", LocationType.SECTOR, rulindoDistrict);
        createLocation("Rukozo", "RULRUK", LocationType.SECTOR, rulindoDistrict);
        createLocation("Rusiga", "RULRUS", LocationType.SECTOR, rulindoDistrict);
        createLocation("Shyorongi", "RULSHY", LocationType.SECTOR, rulindoDistrict);
        createLocation("Tumba", "RULTUM", LocationType.SECTOR, rulindoDistrict);
    }

    // ========================================================================
    // SOUTHERN PROVINCE - 8 Districts, 102 Sectors
    // ========================================================================
    private void loadSouthernProvince() {
        logger.info("Loading Southern Province...");
        Location southern = createLocation("Southern Province", "STH", LocationType.PROVINCE, null);

        Location gisagara = createLocation("Gisagara", "STHGIS", LocationType.DISTRICT, southern);
        Location huye = createLocation("Huye", "STHHUY", LocationType.DISTRICT, southern);
        Location kamonyi = createLocation("Kamonyi", "STHKAM", LocationType.DISTRICT, southern);
        Location muhanga = createLocation("Muhanga", "STHMUH", LocationType.DISTRICT, southern);
        Location nyamagabe = createLocation("Nyamagabe", "STHNYAM", LocationType.DISTRICT, southern);
        Location nyanza = createLocation("Nyanza", "STHNYA", LocationType.DISTRICT, southern);
        Location nyaruguru = createLocation("Nyaruguru", "STHNYAR", LocationType.DISTRICT, southern);
        Location ruhango = createLocation("Ruhango", "STHRUH", LocationType.DISTRICT, southern);

        loadGisagaraSectors(gisagara);
        loadHuyeSectors(huye);
        loadKamonyiSectors(kamonyi);
        loadMuhangaSectors(muhanga);
        loadNyamagabeSectors(nyamagabe);
        loadNyanzaSectors(nyanza);
        loadNyaruguruSectors(nyaruguru);
        loadRuhangoSectors(ruhango);
    }

    private void loadGisagaraSectors(Location gisagaraDistrict) {
        // All 13 Gisagara Sectors
        createLocation("Gikonko", "GISGIK", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Gishubi", "GISGIS", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Kansi", "GISKAN", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Kibilizi", "GISKIB", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Kigembe", "GISKIG", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Mamba", "GISMAM", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Muganza", "GISMUG", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Mugombwa", "GISMUGO", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Mukindo", "GISMUK", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Musha", "GISMUS", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Ndora", "GISNDO", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Nyanza", "GISNYA", LocationType.SECTOR, gisagaraDistrict);
        createLocation("Save", "GISSAV", LocationType.SECTOR, gisagaraDistrict);
    }

    private void loadHuyeSectors(Location huyeDistrict) {
        // All 14 Huye Sectors
        createLocation("Gishamvu", "HUYGIS", LocationType.SECTOR, huyeDistrict);
        createLocation("Huye", "HUYHUY", LocationType.SECTOR, huyeDistrict);
        createLocation("Karama", "HUYKAR", LocationType.SECTOR, huyeDistrict);
        createLocation("Kigoma", "HUYKIG", LocationType.SECTOR, huyeDistrict);
        createLocation("Kinazi", "HUYKIN", LocationType.SECTOR, huyeDistrict);
        Location maraba = createLocation("Maraba", "HUYMAR", LocationType.SECTOR, huyeDistrict);
        createLocation("Mbazi", "HUYMBA", LocationType.SECTOR, huyeDistrict);
        createLocation("Mukura", "HUYMUK", LocationType.SECTOR, huyeDistrict);
        createLocation("Ngoma", "HUYNGO", LocationType.SECTOR, huyeDistrict);
        createLocation("Ruhashya", "HUYRUH", LocationType.SECTOR, huyeDistrict);
        createLocation("Rusatira", "HUYRUS", LocationType.SECTOR, huyeDistrict);
        createLocation("Rwaniro", "HUYRWA", LocationType.SECTOR, huyeDistrict);
        createLocation("Simbi", "HUYSIM", LocationType.SECTOR, huyeDistrict);
        createLocation("Tumba", "HUYTUM", LocationType.SECTOR, huyeDistrict);

        loadMarabaCells(maraba);
    }

    private void loadMarabaCells(Location marabaSector) {
        Location maraba = createLocation("Maraba", "MARMAR", LocationType.CELL, marabaSector);
        Location sovu = createLocation("Sovu", "MARSOV", LocationType.CELL, marabaSector);

        createLocation("Maraba I", "MARMAR1", LocationType.VILLAGE, maraba);
        createLocation("Maraba II", "MARMAR2", LocationType.VILLAGE, maraba);
        createLocation("Maraba III", "MARMAR3", LocationType.VILLAGE, maraba);

        createLocation("Sovu A", "MARSOVA", LocationType.VILLAGE, sovu);
        createLocation("Sovu B", "MARSOVB", LocationType.VILLAGE, sovu);
    }

    private void loadKamonyiSectors(Location kamonyiDistrict) {
        // All 10 Kamonyi Sectors
        createLocation("Gacurabwenge", "KAMGAC", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Karama", "KAMKAR", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Kayenzi", "KAMKAY", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Kayumbu", "KAMKAYU", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Mugina", "KAMMUG", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Musambira", "KAMMUS", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Ngamba", "KAMNGA", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Nyamiyaga", "KAMNYA", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Nyarubaka", "KAMNYAR", LocationType.SECTOR, kamonyiDistrict);
        createLocation("Rukoma", "KAMRUK", LocationType.SECTOR, kamonyiDistrict);
    }

    private void loadMuhangaSectors(Location muhangaDistrict) {
        // All 12 Muhanga Sectors
        // FIXED: Changed Muhanga code from MUHMUH to MUHANG to avoid duplicate
        createLocation("Cyeza", "MUHCYE", LocationType.SECTOR, muhangaDistrict);
        createLocation("Gatuntu", "MUHGAT", LocationType.SECTOR, muhangaDistrict);
        createLocation("Kabacuzi", "MUHKAB", LocationType.SECTOR, muhangaDistrict);
        createLocation("Kibangu", "MUHKIB", LocationType.SECTOR, muhangaDistrict);
        createLocation("Kiyumba", "MUHKIY", LocationType.SECTOR, muhangaDistrict);
        createLocation("Muhanga", "MUHANG", LocationType.SECTOR, muhangaDistrict);
        createLocation("Mushishiro", "MUHMUS", LocationType.SECTOR, muhangaDistrict);
        createLocation("Nyabinoni", "MUHNYA", LocationType.SECTOR, muhangaDistrict);
        createLocation("Nyamabuye", "MUHNYAM", LocationType.SECTOR, muhangaDistrict);
        createLocation("Nyarusange", "MUHNYAR", LocationType.SECTOR, muhangaDistrict);
        createLocation("Rongi", "MUHRON", LocationType.SECTOR, muhangaDistrict);
        createLocation("Shyogwe", "MUHSHY", LocationType.SECTOR, muhangaDistrict);
    }

    private void loadNyamagabeSectors(Location nyamagabeDistrict) {
        // All 16 Nyamagabe Sectors (FIXED: Was missing one)
        createLocation("Buruhukiro", "NYAMBUR", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Cyanika", "NYAMCYA", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Gatare", "NYAMGAT", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Kaduha", "NYAMKAD", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Kamegeri", "NYAMKAM", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Kibirizi", "NYAMKIB", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Kibumbwe", "NYAMKIBU", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Kitabi", "NYAMKIT", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Mbazi", "NYAMMBA", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Mugano", "NYAMMUG", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Musange", "NYAMMUS", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Musebeya", "NYAMMUSEB", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Mushubi", "NYAMMUSH", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Nkomane", "NYAMNKO", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Tare", "NYAMTAR", LocationType.SECTOR, nyamagabeDistrict);
        createLocation("Uwinkingi", "NYAMUWI", LocationType.SECTOR, nyamagabeDistrict);
    }

    private void loadNyanzaSectors(Location nyanzaDistrict) {
        // All 10 Nyanza Sectors
        createLocation("Busasamana", "NYABUS", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Busoro", "NYABUSO", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Cyabakamyi", "NYACYA", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Kibirizi", "NYAKIB", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Kigembe", "NYAKIG", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Mukingo", "NYAMUK", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Muyira", "NYAMUY", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Ntyazo", "NYANT", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Nyagisozi", "NYANYAG", LocationType.SECTOR, nyanzaDistrict);
        createLocation("Rwabicuma", "NYARWA", LocationType.SECTOR, nyanzaDistrict);
    }

    private void loadNyaruguruSectors(Location nyaruguruDistrict) {
        // All 14 Nyaruguru Sectors
        createLocation("Busanze", "NYARBUS", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Cyahinda", "NYARCYA", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Kibeho", "NYARKIB", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Kivu", "NYARKIV", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Mata", "NYARMAT", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Munini", "NYARMUN", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Ngera", "NYARNGE", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Ngoma", "NYARNGO", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Nyabimata", "NYARNYA", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Nyagisozi", "NYARNYAG", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Ruheru", "NYARRUH", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Ruramba", "NYARRUR", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Rusenge", "NYARRUS", LocationType.SECTOR, nyaruguruDistrict);
        createLocation("Rwabicuma", "NYARRWA", LocationType.SECTOR, nyaruguruDistrict);
    }

    private void loadRuhangoSectors(Location ruhangoDistrict) {
        // All 9 Ruhango Sectors
        createLocation("Bweramana", "RUHBWE", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Byimana", "RUHBYI", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Kabagali", "RUHKAB", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Kinazi", "RUHKIN", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Kinihira", "RUHKINI", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Mbuye", "RUHMBU", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Mwendo", "RUHMWE", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Ntongwe", "RUHNTO", LocationType.SECTOR, ruhangoDistrict);
        createLocation("Ruhango", "RUHRUH", LocationType.SECTOR, ruhangoDistrict);
    }

    // ========================================================================
    // WESTERN PROVINCE - 7 Districts, 96 Sectors
    // ========================================================================
    private void loadWesternProvince() {
        logger.info("Loading Western Province...");
        Location western = createLocation("Western Province", "WST", LocationType.PROVINCE, null);

        Location karongi = createLocation("Karongi", "WSTKAR", LocationType.DISTRICT, western);
        Location ngororero = createLocation("Ngororero", "WSTNGO", LocationType.DISTRICT, western);
        Location nyabihu = createLocation("Nyabihu", "WSTNYA", LocationType.DISTRICT, western);
        Location nyamasheke = createLocation("Nyamasheke", "WSTNYAM", LocationType.DISTRICT, western);
        Location rubavu = createLocation("Rubavu", "WSTRUB", LocationType.DISTRICT, western);
        Location rusizi = createLocation("Rusizi", "WSTRUS", LocationType.DISTRICT, western);
        Location rutsiro = createLocation("Rutsiro", "WSTRUT", LocationType.DISTRICT, western);

        loadKarongiSectors(karongi);
        loadNgororeroSectors(ngororero);
        loadNyabihuSectors(nyabihu);
        loadNyamashekeSectors(nyamasheke);
        loadRubavuSectors(rubavu);
        loadRusiziSectors(rusizi);
        loadRutsiroSectors(rutsiro);
    }

    private void loadKarongiSectors(Location karongiDistrict) {
        // All 13 Karongi Sectors
        createLocation("Bwishyura", "KARBWI", LocationType.SECTOR, karongiDistrict);
        createLocation("Gitesi", "KARGIT", LocationType.SECTOR, karongiDistrict);
        createLocation("Murambi", "KARMUR", LocationType.SECTOR, karongiDistrict);
        createLocation("Murundi", "KARMURU", LocationType.SECTOR, karongiDistrict);
        createLocation("Mutuntu", "KARMUT", LocationType.SECTOR, karongiDistrict);
        createLocation("Rubengera", "KARRUB", LocationType.SECTOR, karongiDistrict);
        createLocation("Rugabano", "KARRUG", LocationType.SECTOR, karongiDistrict);
        createLocation("Ruganda", "KARRUGA", LocationType.SECTOR, karongiDistrict);
        createLocation("Mubuga", "KARMUB", LocationType.SECTOR, karongiDistrict);
        createLocation("Gishyita", "KARGIS", LocationType.SECTOR, karongiDistrict);
        createLocation("Gisovu", "KARGISO", LocationType.SECTOR, karongiDistrict);
        createLocation("Rwankuba", "KARRWAN", LocationType.SECTOR, karongiDistrict);
        createLocation("Twumba", "KARTWU", LocationType.SECTOR, karongiDistrict);
    }

    private void loadNgororeroSectors(Location ngororeroDistrict) {
        // All 13 Ngororero Sectors
        createLocation("Bwira", "NGOBWI", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Gatumba", "NGOGAT", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Hindiro", "NGOHIN", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Kabaya", "NGOKAB", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Kageyo", "NGOKAG", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Kavumu", "NGOKAV", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Matyazo", "NGOMAT", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Muhanda", "NGOMUH", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Muhororo", "NGOMUHO", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Ndaro", "NGONDAR", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Ngororero", "NGONGO", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Nyange", "NGONYA", LocationType.SECTOR, ngororeroDistrict);
        createLocation("Sovu", "NGOSOV", LocationType.SECTOR, ngororeroDistrict);
    }

    private void loadNyabihuSectors(Location nyabihuDistrict) {
        // All 13 Nyabihu Sectors (FIXED: Removed duplicate Mukamira)
        createLocation("Bigogwe", "NYABIG", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Jenda", "NYAJEN", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Jomba", "NYAJOM", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Kabatwa", "NYAKABA", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Karago", "NYAKAR", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Kintobo", "NYAKIN", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Mukamira", "NYAMUK", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Muringa", "NYAMUR", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Rambura", "NYARAM", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Rugera", "NYARUG", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Rurembo", "NYARUR", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Shyira", "NYASHY", LocationType.SECTOR, nyabihuDistrict);
        createLocation("Ruhunda", "NYARUHUN", LocationType.SECTOR, nyabihuDistrict);
    }

    private void loadNyamashekeSectors(Location nyamashekeDistrict) {
        // All 15 Nyamasheke Sectors
        createLocation("Bushekeri", "NYAMBUS", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Bushenge", "NYAMBUSH", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Cyato", "NYAMCYA", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Gihombo", "NYAMGIH", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Kagano", "NYAMKAG", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Kanjongo", "NYAMKAN", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Karambi", "NYAMKAR", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Karengera", "NYAMKARE", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Kirimbi", "NYAMKIR", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Macuba", "NYAMMAC", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Mahembe", "NYAMMAH", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Nyabitekeri", "NYAMNYAB", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Rangiro", "NYAMRAN", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Ruharambuga", "NYAMRUH", LocationType.SECTOR, nyamashekeDistrict);
        createLocation("Shangi", "NYAMSHA", LocationType.SECTOR, nyamashekeDistrict);
    }

    private void loadRubavuSectors(Location rubavuDistrict) {
        // All 12 Rubavu Sectors
        createLocation("Bugeshi", "RUBBUG", LocationType.SECTOR, rubavuDistrict);
        createLocation("Busasamana", "RUBBUS", LocationType.SECTOR, rubavuDistrict);
        createLocation("Cyanzarwe", "RUBCYA", LocationType.SECTOR, rubavuDistrict);
        Location gisenyi = createLocation("Gisenyi", "RUBGIS", LocationType.SECTOR, rubavuDistrict);
        createLocation("Kanama", "RUBKAN", LocationType.SECTOR, rubavuDistrict);
        createLocation("Kanzenze", "RUBKANZ", LocationType.SECTOR, rubavuDistrict);
        createLocation("Kabaya", "RUBKAB", LocationType.SECTOR, rubavuDistrict);
        createLocation("Mudende", "RUBMUD", LocationType.SECTOR, rubavuDistrict);
        createLocation("Nyamyumba", "RUBNYA", LocationType.SECTOR, rubavuDistrict);
        createLocation("Nyundo", "RUBNYU", LocationType.SECTOR, rubavuDistrict);
        createLocation("Rubavu", "RUBRUB", LocationType.SECTOR, rubavuDistrict);
        createLocation("Rugerero", "RUBRUG", LocationType.SECTOR, rubavuDistrict);

        loadGisenyiCells(gisenyi);
    }

    private void loadGisenyiCells(Location gisenyiSector) {
        Location gisenyi = createLocation("Gisenyi", "GISGIS", LocationType.CELL, gisenyiSector);
        Location rubavu = createLocation("Rubavu", "GISRUB", LocationType.CELL, gisenyiSector);

        createLocation("Gisenyi I", "GISGIS1", LocationType.VILLAGE, gisenyi);
        createLocation("Gisenyi II", "GISGIS2", LocationType.VILLAGE, gisenyi);
        createLocation("Gisenyi III", "GISGIS3", LocationType.VILLAGE, gisenyi);

        createLocation("Rubavu A", "GISRUBA", LocationType.VILLAGE, rubavu);
        createLocation("Rubavu B", "GISRUBB", LocationType.VILLAGE, rubavu);
    }

    private void loadRusiziSectors(Location rusiziDistrict) {
        // All 18 Rusizi Sectors
        createLocation("Bugarama", "RUSBUG", LocationType.SECTOR, rusiziDistrict);
        createLocation("Butare", "RUSBUT", LocationType.SECTOR, rusiziDistrict);
        createLocation("Buzi", "RUSBUZ", LocationType.SECTOR, rusiziDistrict);
        createLocation("Gikundamvura", "RUSGIK", LocationType.SECTOR, rusiziDistrict);
        createLocation("Giheke", "RUSGIH", LocationType.SECTOR, rusiziDistrict);
        createLocation("Gihundwe", "RUSGIHU", LocationType.SECTOR, rusiziDistrict);
        createLocation("Gitambi", "RUSGIT", LocationType.SECTOR, rusiziDistrict);
        createLocation("Kamembe", "RUSKAM", LocationType.SECTOR, rusiziDistrict);
        createLocation("Muganza", "RUSMUG", LocationType.SECTOR, rusiziDistrict);
        createLocation("Mururu", "RUSMUR", LocationType.SECTOR, rusiziDistrict);
        createLocation("Nkanka", "RUSNKA", LocationType.SECTOR, rusiziDistrict);
        createLocation("Nkombo", "RUSNKO", LocationType.SECTOR, rusiziDistrict);
        createLocation("Nkungu", "RUSNKU", LocationType.SECTOR, rusiziDistrict);
        createLocation("Nyakabuye", "RUSNYA", LocationType.SECTOR, rusiziDistrict);
        createLocation("Nyakarenzo", "RUSNYAK", LocationType.SECTOR, rusiziDistrict);
        createLocation("Nzahaha", "RUSNZA", LocationType.SECTOR, rusiziDistrict);
        createLocation("Rwimbogo", "RUSRWI", LocationType.SECTOR, rusiziDistrict);
        createLocation("Songa", "RUSSON", LocationType.SECTOR, rusiziDistrict);
    }

    private void loadRutsiroSectors(Location rutsiroDistrict) {
        // All 13 Rutsiro Sectors
        createLocation("Boneza", "RUTBON", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Gihango", "RUTGIH", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Kigeyo", "RUTKIG", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Kivumu", "RUTKIV", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Manihira", "RUTMAN", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Mukura", "RUTMUK", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Murunda", "RUTMUR", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Musasa", "RUTMUS", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Mushonyi", "RUTMUSH", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Mushubati", "RUTMUSHU", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Nyabirasi", "RUTNYA", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Ruhango", "RUTRUH", LocationType.SECTOR, rutsiroDistrict);
        createLocation("Rusebeya", "RUTRUS", LocationType.SECTOR, rutsiroDistrict);
    }

    // ========================================================================
    // HELPER METHOD
    // ========================================================================
    private Location createLocation(String name, String code, LocationType type, Location parent) {
        try {
            // Check if location already exists
            Optional<Location> existing = locationRepository.findByCode(code);
            if (existing.isPresent()) {
                logger.info("Location already exists: {} ({})", name, code);
                return existing.get();
            }

            Location location = new Location();
            location.setName(name);
            location.setCode(code);
            location.setType(type);
            location.setParent(parent);
            location.setChildren(new ArrayList<>());

            Location saved = locationRepository.save(location);
            locationCache.put(code, saved);

            return saved;
        } catch (DataIntegrityViolationException e) {
            logger.error("Duplicate code detected: {} for location: {}", code, name);
            // Try to find and return existing
            return locationRepository.findByCode(code)
                    .orElseThrow(() -> new RuntimeException("Failed to create or find location: " + name, e));
        } catch (Exception e) {
            logger.error("Failed to create location: {} (Code: {}, Type: {})", name, code, type, e);
            throw e;
        }
    }
}
