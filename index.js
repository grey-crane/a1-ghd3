console.log("d3 version", d3.version); // test that d3 loaded

const circleOfFifths = [
  { major: "C", minor: "A" },
  { major: "G", minor: "Db" },
  { major: "D", minor: "B" },
  { major: "A", minor: "F#" },
  { major: "E", minor: "C#" },
  { major: "Cb/B", minor: "Ab/G#" },
  { major: "Gb/F#", minor: "Eb/D#" },
  { major: "Db/C#", minor: "Bb/A#" },
  { major: "Ab", minor: "F" },
  { major: "Eb", minor: "C" },
  { major: "Bb", minor: "G" },
  { major: "F", minor: "D" },
];
const Keys = {
  Major: "Major",
  Minor: "Minor",
};

const accidentals = (root, keyType) => {
  const orderOfSharps = ["F", "C", "G", "D", "A", "E", "B"];
  const orderByNote = (key) => { // returns function that sorts accidentals
    const notes = ["C", "D", "E", "F", "G", "A", "B"];
    const start = notes.indexOf(key[0]);
    const rank = (note) => (notes.indexOf(note[0]) - start + 7) % 7;
    return (a, b) => rank(a) - rank(b);
  };

  let lines = ["Accidentals"]
  const index = keyType === Keys.Minor ?
    circleOfFifths.map(({_, minor}) => minor).findIndex((note) => note === root)
    : circleOfFifths.map(({major, _}) => major).findIndex((note) => note === root);
  if (index < 0) return [];

  if (index >= 5) { // key written with flats
    lines.push([...orderOfSharps].reverse().slice(0, 12 - index)
      .sort(orderByNote(root))
      .map((n) => n + "b")
      .join(" "));
  }
  if (index <= 7) { // key writtne with sharps
    lines.push(orderOfSharps.slice(0, index)
      .sort(orderByNote(root.slice(3)))
      .map((n) => n + "#")
      .join(" "));
  }

  return lines;
};


// Declare the chart dimensions and margins.
const chart = (() => {
  const width = 1600;
  const height = 1200;
  const sideTotal = 12;

  const innerR = 200;
  const middleR = 300;
  const outerR = 500;
  const border = {
    x: -width/2 + 50,
    y: -height/2 + 50,
    width: width - 100,
    height: height - 100,
  };

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    // center origin in viewBox
    .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`);

  const section = d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .angle((d) => d.angle)
    .radius((d) => d.radius);

  // border 
  svg.append("svg:rect")
    .attr("id", "border")
    .attr("x", border.x)
    .attr("y", border.y)
    .attr("width", border.width)
    .attr("height", border.height);

  const sectors = svg.append("svg:g").attr("id", "sectors");
  const labels = svg.append("svg:g").attr("id", "labels"); // keeps labels always visible
  const center = svg.append("svg:g").attr("class", "lines");
  const accidentalsLabel = labels.append("svg:g").attr("id", "accidentals");

  const updateCenter = (root = null, keyType) => {
    let strings = [];
    if (root === null) {
      strings = ["Circle", "Of", "Fifths"];
    } else {
      strings = accidentals(root, keyType);
    }
    accidentalsLabel
      .selectAll("text")
      .data(strings)
      .join("text")
      .attr("class", "label text")
      .attr("y", (d, i) => i * 40 - 40) // for multi line items
      .text((d) => d);
  };

  const createSector = (shape, color, key, keyType) => {
    return d3.create("svg:path")
        .attr("d", section(shape.points))
        .attr("class", "lines")
        .attr("fill", color)
        .attr("stroke", "black")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("stroke", "white").raise();
          updateCenter(key, keyType);
        })
        .on("mouseleave", function (event, d) {
          if (clicked) {
            d3.select(clicked.elem).raise();
            updateCenter(clicked.key, clicked.keyType);
            if (this === clicked.elem) return;
          } else {
            updateCenter();
          }
          d3.select(this).attr("stroke", "black");
        })
        .on("click", function (event, d) {
          if (clicked) {
            d3.select(clicked.elem).attr("stroke", "black").attr("class", "lines").lower();
            updateCenter();
            if (clicked.elem === this) {
              clicked = null;
              return;
            }
          }
          d3.select(this).attr("stroke", "white").attr("class", "clicked").raise();
          updateCenter(key, keyType);
          clicked = {elem: this, key: key, keyType: keyType};
        })
        .node();
  };

  const createLabel = (shape, key, cls) => {
    return d3.create("svg:text")
      .text(key)
      .attr("x", shape.center.x)
      .attr("y", shape.center.y)
      .attr("class", cls)
      .node();
  };
  const sectionBox = (sideN, inR, outR) => {
      // offset puts first item at top of circle
    const sideToAngle = (sideN) => {
      return (sideN / sideTotal) * 2 * Math.PI - (Math.PI / 12);
    };
    const aStart = sideToAngle(sideN);
    const aEnd = sideToAngle(sideN + 1);

    return {
      points: [
        { angle: aStart, radius: inR },
        { angle: aEnd, radius: inR },
        { angle: aEnd, radius: outR },
        { angle: aStart, radius: outR },
      ],
      // rotates label 90 deg ccw to align label with sector
      center: {
        x: ((inR + outR) / 2) * Math.sin((aStart + aEnd) / 2),
        y: (-(inR + outR) / 2) * Math.cos((aStart + aEnd) / 2),
      },
    };
  };

  const color = d3.scaleSequential([0, sideTotal], d3.interpolateRainbow);
  let clicked = null;

  circleOfFifths.forEach((key, i) => {
    const majSector = sectionBox(i, middleR, outerR);
    const minSector = sectionBox(i, innerR, middleR);

    sectors.append(() => createSector(majSector, color(i), key.major, Keys.Major));
    sectors.append(() => createSector(minSector, color(i), key.minor, Keys.Minor));

    labels.append(() => createLabel(majSector, key.major, "key label"));
    labels.append(() => createLabel(minSector, key.minor, "text label"));
  });
  updateCenter();

  return svg.node();
})();

document.getElementById("container").append(chart);

