// CLEAN DNTU HEADER ASSET EXAMPLE
// Assets contain NO bell/avatar/user UI.

export function StaffHeaderDecor() {
  return (
    <>
      <img
        src="/DNTU_Web_Asset_Kit/watermarks/dntu-campus-clean.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-8px] h-[96px] w-[520px] -translate-x-1/2 object-contain opacity-50 select-none"
      />

      <img
        src="/DNTU_Web_Asset_Kit/watermarks/dntu-slogan-burgundy.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-56 top-1/2 h-8 w-auto -translate-y-1/2 object-contain opacity-80 select-none"
      />
    </>
  );
}

/*
Bell, avatar, user name and dropdown MUST be real React components,
not part of any image asset.
*/
