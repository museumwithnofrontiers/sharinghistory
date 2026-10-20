// Legacy's sponsors of Sharing History (`mwnf3_sharing_history.sh_sponsors`,
// project AWE), in the order its two pages list them (`sponsor_detail.php`,
// `sponsor_detail_local.php`): the international ones (country `ww`), then
// the local ones under their country. The logos are legacy's
// (theme/assets/sponsors/sh_sponsors/<id>.jpg) and each link is the one
// legacy gives; where that is legacy's own partner page, `partner` is the
// partner's legacy key and the link goes to the partner's page here. The
// names and remarks are legacy's texts, through site-i18n.
import s1 from '../../theme/assets/sponsors/sh_sponsors/1.jpg'
import s2 from '../../theme/assets/sponsors/sh_sponsors/2.jpg'
import s3 from '../../theme/assets/sponsors/sh_sponsors/3.jpg'
import s4 from '../../theme/assets/sponsors/sh_sponsors/4.jpg'
import s5 from '../../theme/assets/sponsors/sh_sponsors/5.jpg'
import s6 from '../../theme/assets/sponsors/sh_sponsors/6.jpg'
import s7 from '../../theme/assets/sponsors/sh_sponsors/7.jpg'
import s8 from '../../theme/assets/sponsors/sh_sponsors/8.jpg'
import s9 from '../../theme/assets/sponsors/sh_sponsors/9.jpg'

export function internationalSponsors(t) {
  return [
    { id: 1, logo: s1, href: 'http://www.sharjahmuseums.ae/', name: t('sharinghistory.sponsors.name1'), remarks: t('sharinghistory.sponsors.remarks1') },
    { id: 2, logo: s2, href: 'http://www.yasar.edu.tr/en/', name: t('sharinghistory.sponsors.name2'), remarks: t('sharinghistory.sponsors.remarks2') },
    { id: 3, logo: s3, href: 'http://www.kunstkultur.bka.gv.at/site/8138/default.aspx', name: t('sharinghistory.sponsors.name3'), remarks: t('sharinghistory.sponsors.remarks3') },
    { id: 4, logo: s4, href: 'http://www.bmeia.gv.at/en/', name: t('sharinghistory.sponsors.name4'), remarks: t('sharinghistory.sponsors.remarks4') },
    { id: 5, logo: s5, partner: 'mwnf3_sharing_history:sh_partners:rm_01', name: t('sharinghistory.sponsors.name5'), remarks: t('sharinghistory.sponsors.remarks5') },
    { id: 6, logo: s6, partner: 'mwnf3_sharing_history:sh_partners:tr_02', name: t('sharinghistory.sponsors.name6'), remarks: t('sharinghistory.sponsors.remarks6') },
    { id: 7, logo: s7, partner: 'mwnf3_sharing_history:sh_partners:at_01', name: t('sharinghistory.sponsors.name7'), remarks: t('sharinghistory.sponsors.remarks7') },
    { id: 9, logo: s9, href: 'http://www.bmwfw.gv.at/Seiten/default.aspx', name: t('sharinghistory.sponsors.name9'), remarks: t('sharinghistory.sponsors.remarks9') },
  ]
}

// By country, as legacy groups them; `country` is the package's country id.
export function localSponsors(t) {
  return [
    {
      country: 'esp',
      sponsors: [
        { id: 8, logo: s8, href: 'http://www.mecd.gob.es/portada-mecd/', name: t('sharinghistory.sponsors.name8'), remarks: '' },
      ],
    },
  ]
}
