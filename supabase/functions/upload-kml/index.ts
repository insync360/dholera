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
      // KML format: lng,lat,alt — parts[0]=lng, parts[1]=lat
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push({ lat, lng });
      }
    }
  }

  return coordinates;
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

    // Collect ALL <coordinates> blocks — handles MultiGeometry, multiple Polygons,
    // and outerBoundaryIs / innerBoundaryIs structures.
    // We only care about outer rings; inner rings (holes) are skipped if they
    // come after the first <coordinates> inside a <Polygon> — but since we create
    // a parcel per block we keep outer rings only by skipping tiny/degenerate ones.
    const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
    let coordMatch;
    let coordsFoundInPlacemark = false;

    while ((coordMatch = coordRegex.exec(placemark)) !== null) {
      const coordinates = parseCoordinateBlock(coordMatch[1]);

      // Need at least 3 points to form a polygon
      if (coordinates.length < 3) continue;

      coordsFoundInPlacemark = true;

      const area = calculatePolygonArea(coordinates);

      let sizeCategory = 'Medium';
      if (area < 2000) sizeCategory = 'Small';
      else if (area > 5000) sizeCategory = 'Large';

      const price = Math.round(area * 3000);

      // Always include index so IDs are unique even when names repeat or
      // a single Placemark expands to multiple parcels via MultiGeometry
      const indexPad = String(index).padStart(3, '0');
      let parcelId: string;
      if (name && name.match(/^[A-Z0-9-]+$/i)) {
        parcelId = `${name}-${timestamp}-${indexPad}`;
      } else {
        parcelId = `${filePrefix}-${timestamp}-${indexPad}`;
      }

      parcels.push({
        parcel_id: parcelId,
        status: 'Available',
        area_sq_m: Math.round(area),
        price,
        coordinates,
        notes: '',
        documents: [],
        description: description || 'Parcel from KML import',
        landmark_distance: '',
        size_category: sizeCategory,
      });

      index++;
    }

    // Placemark had no usable coordinate blocks — still advance index
    if (!coordsFoundInPlacemark) index++;
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

  area = Math.abs(area * R * R / 2);
  return area;
}

function extractKMLFromKMZ(kmzData: Uint8Array): string {
  try {
    const unzipped = unzipSync(kmzData);

    for (const [filename, data] of Object.entries(unzipped)) {
      if (filename.toLowerCase().endsWith('.kml')) {
        return strFromU8(data as Uint8Array);
      }
    }

    if (unzipped['doc.kml']) {
      return strFromU8(unzipped['doc.kml']);
    }

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
      const kmzData = new Uint8Array(arrayBuffer);
      kmlContent = extractKMLFromKMZ(kmzData);

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
        JSON.stringify({ error: 'No valid parcels found in KML file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('authorization');
    let userEmail = 'anonymous';

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user?.email) {
        userEmail = user.email;
      }
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
      console.error('Upload history error:', uploadError);
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
      console.error('Insert error:', insertError);
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
