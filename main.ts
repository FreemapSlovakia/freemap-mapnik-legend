import { parse } from "https://deno.land/std/encoding/yaml.ts";

const props = {
  zoom: 18,
  bbox: [-0.002, -0.0005, 0.002, 0.0005],
  scale: 1,
  width: 80,
};

const routeDefaults = {
  id: 1,
  h_red: 0,
  h_blue: 0,
  h_green: 0,
  h_yellow: 0,
  h_black: 0,
  h_white: 0,
  h_orange: 0,
  h_purple: 0,
  h_red_loc: 0,
  h_blue_loc: 0,
  h_green_loc: 0,
  h_yellow_loc: 0,
  h_black_loc: 0,
  h_white_loc: 0,
  h_orange_loc: 0,
  h_purple_loc: 0,
  b_red: 0,
  b_blue: 0,
  b_green: 0,
  b_yellow: 0,
  b_black: 0,
  b_white: 0,
  b_orange: 0,
  b_purple: 0,
  s_red: 0,
  s_blue: 0,
  s_green: 0,
  s_yellow: 0,
  s_black: 0,
  s_white: 0,
  s_orange: 0,
  s_purple: 0,
  r_red: 0,
  r_blue: 0,
  r_green: 0,
  r_yellow: 0,
  r_black: 0,
  r_white: 0,
  r_orange: 0,
  r_purple: 0,
  refs1: "",
  refs2: "",
  off1: 0,
  off2l: 0,
};

function asLine(styles: string[], properties: Record<string, unknown>) {
  return {
    styles,
    geojson: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [-1, -0.1],
          [1, 0.1],
        ],
      },
      properties,
    },
  };
}

function asPoint(styles: string[], properties: Record<string, unknown>) {
  return {
    styles,
    geojson: {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties,
    },
  };
}

function asArea(styles: string[], properties: Record<string, unknown>) {
  return {
    styles,
    geojson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
            [-1, -1],
          ],
        ],
      },
      properties,
    },
  };
}

function pack(legend: any[]) {
  return {
    legend,
    ...props,
  };
}

async function run(filename: string, data: unknown) {
  const response = await fetch("http://localhost:4000/legend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const file = await Deno.open("out/" + filename, {
    create: true,
    write: true,
    truncate: true,
  });

  if (response.body) {
    for await (const chunk of response.body) {
      await Deno.writeAll(file, chunk);
    }
  }

  file.close();
}

const decoder = new TextDecoder("utf-8");

const data = await Deno.readFile("/home/martin/fm/freemap-mapnik/mapping.yaml");

const mapping = await parse(decoder.decode(data));

// console.log(mapping);

const track3 = asLine(["higwayGlows", "highways"], {
  type: "track",
  tracktype: "grade3",
  class: "highway",
  bridge: "",
  tunnel: "",
});

const forest = asArea(["landcover"], { type: "forest" });

await Promise.all([
  // ...Object.values((mapping as any).tables.landusages.mapping)
  //   .flat()
  //   .map((type) =>
  //     run(`landcover-${type}.png`, pack([asArea(["landcover"], { type })]))
  //   ),

  // ...Object.values((mapping as any).tables.features.mappings)
  //   .flatMap((x: any) => Object.values(x.mapping))
  //   .flat()
  //   .map((type) =>
  //     run(`poi-${type}.png`, pack([forest, asPoint(["features"], { type })]))
  //   ),

  ...[1, 2, 3, 4, 5].map((type) =>
    run(
      `track-grade${type}.png`,
      pack([
        forest,
        asLine(["higwayGlows", "highways"], {
          type: "track",
          tracktype: `grade${type}`,
          class: "highway",
          bridge: "",
          tunnel: "",
        }),
      ])
    )
  ),

  ...(mapping as any).tables.roads.mappings.roads.mapping.highway.map(
    (type: string) =>
      run(
        `highway-${type}.png`,
        pack([
          forest,
          asLine(["higwayGlows", "highways"], {
            type,
            class: "highway",
            bridge: "",
            tunnel: "",
            tracktype: "",
          }),
        ])
      )
  ),

  ...(mapping as any).tables.roads.mappings.railway.mapping.railway.map(
    (type: string) =>
      run(
        `rail-${type}.png`,
        pack([
          forest,
          asLine(["highways"], {
            type,
            class: "railway",
            bridge: "",
            tunnel: "",
            tracktype: "",
          }),
        ])
      )
  ),

  run(
    "trail-rwn.png",
    pack([
      forest,
      track3,
      asLine(["routes"], {
        ...routeDefaults,
        h_red: 1,
      }),
    ])
  ),

  run(
    "trail-lwn.png",
    pack([
      forest,
      track3,
      asLine(["routes"], {
        ...routeDefaults,
        h_red_loc: 1,
      }),
    ])
  ),

  run(
    "bicycle.png",
    pack([
      forest,
      track3,
      asLine(["routes"], {
        ...routeDefaults,
        b_red: 1,
      }),
    ])
  ),

  run(
    "piste.png",
    pack([
      forest,
      track3,
      asLine(["routes"], {
        ...routeDefaults,
        s_red: 1,
      }),
    ])
  ),

  run(
    "horse.png",
    pack([
      forest,
      track3,
      asLine(["routes"], {
        ...routeDefaults,
        r_red: 1,
      }),
    ])
  ),
]);

// TODO

//     .layer('placenames', { type: 'csv', inline: `
// id|name|type|wkt
// 1|Test 123|town|Point(21.219835 48.655111)
// ` }, { srs: '+init=epsg:4326', bufferSize: 1024 })

//       .layer('protected_areas', { type: 'csv', inline: `
// id|type|wkt
// 1|protected_area|Polygon((21.21 48.655, 21.22 48.655, 21.22 48.654, 21.21 48.654, 21.21 48.655))
// ` }, { srs: '+init=epsg:4326', bufferSize: 1024 })

//     .layer('highways', { type: 'csv', inline: `
// id|type|tracktype|class|service|bridge|tunnel|wkt
// 1|track|grade3|highway||0|0|Linestring(21.21 48.655111, 21.22 48.654111)
// ` }, { srs: '+init=epsg:4326', bufferSize: 1024 })

//     .layer('routes', { type: 'csv', inline: `
// id|h_red|h_blue|h_green|h_yellow|h_black|h_white|h_orange|h_purple|h_red_loc|h_blue_loc|h_green_loc|h_yellow_loc|h_black_loc|h_white_loc|h_orange_loc|h_purple_loc|b_red|b_blue|b_green|b_yellow|b_black|b_white|b_orange|b_purple|s_red|s_blue|s_green|s_yellow|s_black|s_white|s_orange|s_purple|r_red|r_blue|r_green|r_yellow|r_black|r_white|r_orange|r_purple|refs1|refs2|off1|off2l|wkt
// 1|1|0|2|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|||0|0|Linestring(21.21 48.655111, 21.22 48.654111)
// ` }, { srs: '+init=epsg:4326', bufferSize: 1024 })
