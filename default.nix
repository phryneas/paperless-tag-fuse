{ nixpkgs ? import <nixpkgs> {  } }:
with nixpkgs;
buildNpmPackage rec {
  pname = "paperless-tag-fuse";
  version = "0.0.1";
  src = ./.;
  npmDepsHash = "sha256-54goABzLemtWY3ypud483IySrLvVOB8XH1B05ylJHUQ=";

  makeWrapperArgs = [ "--prefix LIBFUSE_PATH : ${fusePackages.fuse_2}/lib/libfuse.so" ];
  buildInputs = [ fusePackages.fuse_2 ];
  nativeBuildInputs = [ pkg-config ];

  installPhase = ''
      npmInstallHook

      makeWrapper $out/lib/node_modules/paperless-tag-fuse/index.js $out/bin/paperless-tag-fuse ${lib.concatStringsSep " " makeWrapperArgs}
  '';
}