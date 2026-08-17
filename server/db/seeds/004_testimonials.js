// Migrates the 3 testimonials currently hardcoded in index.njk (both the
// visible section and JSON-LD) into the DB, so nothing regresses when the
// homepage switches to reading from here.
exports.seed = async function (knex) {
  await knex('testimonials').del();
  await knex('testimonials').insert([
    {
      author_name: 'Mahmudul Hasan',
      author_title: 'Factory Owner, Gazipur',
      rating: 5,
      review_text: 'Bongshai Housing delivered our industrial shed in Gazipur ahead of schedule. The quality of the steel structure is phenomenal and the team was highly professional.',
      sort_order: 0,
    },
    {
      author_name: 'Anwar Sadat',
      author_title: "Resort Developer, Cox's Bazar",
      rating: 5,
      review_text: 'We built our eco-friendly resort using their prefab modular units. The finish is indistinguishable from concrete, but it was built in half the time!',
      sort_order: 1,
    },
    {
      author_name: 'Farhana Rahman',
      author_title: 'Homeowner, Dhaka',
      rating: 5,
      review_text: 'From the first 3D mockup to the final handover, the process was seamless. Our two-story steel-framed house looks absolutely gorgeous.',
      sort_order: 2,
    },
  ]);
  console.log('Seeded 3 testimonials.');
};
