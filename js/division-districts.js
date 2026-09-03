// Bangladesh's 8 divisions grouped by district, matching the spellings used
// sitewide (service-areas.html's areaServed schema list). Shared across every
// form with a Division -> District cascade so the list can't drift out of
// sync between pages the way the referral-code formula once did.
var DIVISION_DISTRICTS = {
  'Dhaka': ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  'Chattogram': ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar", 'Feni', 'Khagrachari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  'Rajshahi': ['Bogura', 'Chapai Nawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
  'Khulna': ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  'Barishal': ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  'Sylhet': ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
  'Rangpur': ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  'Mymensingh': ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur']
};

function initDivisionCascade(divisionSelectId, districtSelectId) {
  var divisionSelect = document.getElementById(divisionSelectId);
  var districtSelect = document.getElementById(districtSelectId);
  if (!divisionSelect || !districtSelect) return;

  Object.keys(DIVISION_DISTRICTS).forEach(function (div) {
    var opt = document.createElement('option');
    opt.value = div;
    opt.textContent = div;
    divisionSelect.appendChild(opt);
  });

  divisionSelect.addEventListener('change', function () {
    var districts = DIVISION_DISTRICTS[divisionSelect.value];
    if (!districts) {
      districtSelect.innerHTML = '<option value="">Select Division First</option>';
      districtSelect.disabled = true;
      return;
    }
    districtSelect.innerHTML = '<option value="">Select District</option>' +
      districts.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');
    districtSelect.disabled = false;
  });
}
