import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unzipSync, strFromU8 } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Coordinate {
  lat: number;
  lng: number;
}

interface ParsedParcel {
  parcel_id: string;
  status: string;
  area_sq_m: number;
  price: number;
  coordinates: Coordinate[];
  notes: string;
  documents: { name: string; url: string }[];
  description: string;
  landmark_distance: string;
  size_category: string;
}

function parseCoordinateBlock(coordString: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  const coordPairs = coordString.trim().split(/\s+/).filter(s => s.length > 0);
  for (const pair of coordPairs) {
    const parts = pair.split(',');
    if (parts.length >= 2) {
      // KML format: lng,lat,alt
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push({ lat, lng });
      }
    }
  }
  return coordinates;
}

function makeParcel(
  coordinates: Coordinate[],
  name: string,
  description: string,
  filePrefix: string,
  timestamp: string,
  index: number,
): ParsedParcel {
  const area = calculatePolygonArea(coordinates);
  let sizeCategory = 'Medium';
  if (area < 2000) sizeCategory = 'Small';
  else if (area > 5000) sizeCategory = 'Large';

  const indexPad = String(index).padStart(3, '0');
  const parcelId = (name && name.match(/^[A-Z0-9-]+$/i))
    ? `${name}-${timestamp}-${indexPad}`
    : `${filePrefix}-${timestamp}-${indexPad}`;

  return {
    parcel_id: parcelId,
    status: 'Available',
    area_sq_m: Math.round(area),
    price: Math.round(area * 3000),
    coordinates,
    notes: '',
    documents: [],
    description: description || 'Parcel from KML import',
    landmark_distance: '',
    size_category: sizeCategory,
  };
}

function parseKML(kmlContent: string, filePrefix: string): ParsedParcel[] {
  const parcels: ParsedParcel[] = [];

  const placemarkRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let placemarkMatch;
  let index = 1;
  const timestamp = Date.now().toString(36).toUpperCase();

  while ((placemarkMatch = placemarkRegex.exec(kmlContent)) !== null) {
    const placemark = placemarkMatch[1];

    const nameMatch = placemark.match(/<name>([^<]*)<\/name>/i);
    const name = nameMatch ? nameMatch[1].trim() : '';

    const descMatch = placemark.match(/<description>([^<]*)<\/description>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // ── Step 1: Standard <Polygon> elements ──────────────────────────────
    // Handles: <Polygon><outerBoundaryIs><LinearRing><coordinates>
    // Also handles MultiGeometry containing multiple <Polygon> elements.
    const polygonRegex = /<Polygon[^>]*>([\s\S]*?)<\/Polygon>/gi;
    let polygonMatch;
    let polygonsFound = false;

    while ((polygonMatch = polygonRegex.exec(placemark)) !== null) {
      const polygonContent = polygonMatch[1];

      // Prefer outerBoundaryIs — ignore inner rings (holes)
      let coordStr: string | null = null;
      const outerMatch = polygonContent.match(
        /<outerBoundaryIs[^>]*>([\s\S]*?)<\/outerBoundaryIs>/i
      );
      if (outerMatch) {
        const cm = outerMatch[1].match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
        if (cm) coordStr = cm[1];
      }
      // Fallback: any <coordinates> directly inside the Polygon
      if (!coordStr) {
        const cm = polygonContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
        if (cm) coordStr = cm[1];
      }
      if (!coordStr) continue;

      const coordinates = parseCoordinateBlock(coordStr);
      if (coordinates.length < 3) continue;

      polygonsFound = true;
      parcels.push(makeParcel(coordinates, name, description, filePrefix, timestamp, index));
      index++;
    }

    // If standard Polygon parsing succeeded, move to the next Placemark
    if (polygonsFound) continue;

    // ── Step 2: Fallback — bare <coordinates> blocks ──────────────────────
    // Some KML exporters (CAD tools, etc.) omit the <Polygon> wrapper and
    // put coordinates directly inside <Placemark> or <LinearRing>.
    // GUARD: skip if the Placemark contains <LineString> — those geometries
    // have multi-point <coordinates> that must not become polygon parcels.
    // NOTE: <Point> is NOT guarded here because a Point's <coordinates> block
    // has only 1 coordinate pair, which is naturally filtered by length < 3.
    // Many KML exporters include a <Point> for label placement alongside
    // polygon coordinates (e.g. <MultiGeometry><Point>…</Point><LinearRing>…</LinearRing>).
    const hasLineString = /<LineString[^>]*>/i.test(placemark);

    if (hasLineString) {
      index++;
      continue;
    }

    const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
    let coordMatch;
    let bareFound = false;

    while ((coordMatch = coordRegex.exec(placemark)) !== null) {
      const coordinates = parseCoordinateBlock(coordMatch[1]);
      if (coordinates.length < 3) continue;

      bareFound = true;
      parcels.push(makeParcel(coordinates, name, description, filePrefix, timestamp, index));
      index++;
    }

    if (!bareFound) index++;
  }

  return parcels;
}

function calculatePolygonArea(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = coords[i].lat * Math.PI / 180;
    const lat2 = coords[j].lat * Math.PI / 180;
    const lng1 = coords[i].lng * Math.PI / 180;
    const lng2 = coords[j].lng * Math.PI / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2);
}

function extractKMLFromKMZ(kmzData: Uint8Array): string {
  try {
    const unzipped = unzipSync(kmzData);
    for (const [filename, data] of Object.entries(unzipped)) {
      if (filename.toLowerCase().endsWith('.kml')) {
        return strFromU8(data as Uint8Array);
      }
    }
    if (unzipped['doc.kml']) return strFromU8(unzipped['doc.kml']);
    return '';
  } catch (error) {
    console.error('KMZ extraction error:', error);
    throw new Error(`Failed to extract KMZ: ${error.message}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.kml') && !fileName.endsWith('.kmz')) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Please upload a KML or KMZ file.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filePrefix = file.name
      .replace(/\.(kml|kmz)$/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10)
      .toUpperCase() || 'P';

    let kmlContent: string;

    if (fileName.endsWith('.kmz')) {
      const arrayBuffer = await file.arrayBuffer();
      kmlContent = extractKMLFromKMZ(new Uint8Array(arrayBuffer));
      if (!kmlContent) {
        return new Response(
          JSON.stringify({ error: 'Could not find KML file inside KMZ archive' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      kmlContent = await file.text();
    }

    const parcels = parseKML(kmlContent, filePrefix);

    if (parcels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid polygon parcels found in KML file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('authorization');
    let userEmail = 'anonymous';
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (user?.email) userEmail = user.email;
    }

    const { data: uploadRecord, error: uploadError } = await supabase
      .from('upload_history')
      .insert({
        filename: file.name,
        parcel_count: parcels.length,
        user_email: userEmail,
        status: 'success',
      })
      .select()
      .single();

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Failed to create upload record: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uploadId = uploadRecord.id;

    const { data: insertedParcels, error: insertError } = await supabase
      .from('parcels')
      .insert(parcels.map(p => ({
        parcel_id: p.parcel_id,
        status: p.status,
        area_sq_m: p.area_sq_m,
        price: p.price,
        coordinates: p.coordinates,
        notes: p.notes,
        documents: p.documents,
        description: p.description,
        landmark_distance: p.landmark_distance,
        size_category: p.size_category,
        upload_id: uploadId,
      })))
      .select();

    if (insertError) {
      await supabase.from('upload_history').delete().eq('id', uploadId);
      return new Response(
        JSON.stringify({ error: `Database error: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        parcel_count: parcels.length,
        upload_id: uploadId,
        parcels: insertedParcels || parcels,
        message: `Successfully imported ${parcels.length} parcels from ${file.name}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing KML:', error);
    return new Response(
      JSON.stringify({ error: `Processing error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
